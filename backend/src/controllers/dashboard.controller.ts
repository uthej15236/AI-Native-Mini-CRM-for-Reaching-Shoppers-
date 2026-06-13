import type { RequestHandler } from "express";
import type { Types } from "mongoose";
import { Campaign } from "../models/Campaign";
import type { CampaignDocument } from "../models/Campaign";
import { CommunicationEvent } from "../models/CommunicationEvent";
import { Customer } from "../models/Customer";
import { Order } from "../models/Order";
import { asyncHandler } from "../utils/asyncHandler";
import type {
  CampaignRecord,
  Channel,
  CommunicationEventRecord,
  DashboardOverview,
} from "../types/marketing";
import type { CommunicationEventDocument } from "../models/CommunicationEvent";
import { safeDivide } from "../utils/marketing";

type ChannelPerformance = Record<
  Channel,
  {
    channel: Channel;
    delivered: number;
    opened: number;
    clicked: number;
    purchased: number;
  }
>;

const emptyChannelPerformance = (): ChannelPerformance => ({
  WhatsApp: { channel: "WhatsApp", delivered: 0, opened: 0, clicked: 0, purchased: 0 },
  SMS: { channel: "SMS", delivered: 0, opened: 0, clicked: 0, purchased: 0 },
  Email: { channel: "Email", delivered: 0, opened: 0, clicked: 0, purchased: 0 },
});

const mapCampaign = (
  campaign: CampaignDocument & { _id: Types.ObjectId }
): CampaignRecord => ({
  campaignId: campaign.campaignId,
  objective: campaign.objective,
  intent: campaign.intent,
  audienceDefinition: campaign.audienceDefinition,
  audienceRuleText: campaign.audienceRuleText,
  audienceCustomerIds: campaign.audienceCustomerIds.map((customerId) => customerId.toString()),
  audiencePreview: campaign.audiencePreview.map((preview) => ({
    ...preview,
    lastOrderDate: new Date(preview.lastOrderDate).toISOString(),
  })),
  recommendedChannel: campaign.recommendedChannel,
  offer: campaign.offer,
  reasoning: [...campaign.reasoning],
  messages: { ...campaign.messages },
  status: campaign.status,
  metrics: { ...campaign.metrics },
  summary: campaign.summary
    ? {
        ...campaign.summary,
        funnel: { ...campaign.summary.funnel },
      }
    : null,
  idempotencyKey: campaign.idempotencyKey,
  launchedAt: campaign.launchedAt ? new Date(campaign.launchedAt).toISOString() : null,
  completedAt: campaign.completedAt ? new Date(campaign.completedAt).toISOString() : null,
  createdAt: new Date(campaign.createdAt).toISOString(),
  updatedAt: new Date(campaign.updatedAt).toISOString(),
});

const mapEvent = (
  event: CommunicationEventDocument & { _id: Types.ObjectId }
): CommunicationEventRecord => ({
  communicationId: event.communicationId,
  campaignId: event.campaign.toString(),
  customerId: event.customer.toString(),
  channel: event.channel,
  eventType: event.eventType,
  timestamp: new Date(event.timestamp).toISOString(),
  idempotencyKey: event.idempotencyKey,
  sequence: event.sequence,
  amountImpact: event.amountImpact,
  source: event.source,
});

export const getOverview: RequestHandler = asyncHandler(async (_req, res) => {
  const [customersCount, ordersCount, campaignsCount, activeCampaigns, completedCampaigns, recentCampaignDocs, recentEventDocs, events] =
    await Promise.all([
      Customer.countDocuments({ isDeleted: { $ne: true } }),
      Order.countDocuments(),
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: "RUNNING" }),
      Campaign.countDocuments({ status: "COMPLETED" }),
      Campaign.find().sort({ updatedAt: -1 }).limit(5).lean(),
      CommunicationEvent.find()
        .sort({ timestamp: -1 })
        .limit(12)
        .lean(),
      CommunicationEvent.find().lean(),
    ]);

  const recentCampaigns = (recentCampaignDocs as Array<CampaignDocument & { _id: Types.ObjectId }>).map(mapCampaign);
  const recentEvents = (recentEventDocs as Array<CommunicationEventDocument & { _id: Types.ObjectId }>).map(mapEvent);

  const funnel = events.reduce(
    (accumulator, event) => {
      accumulator[event.eventType] += 1;
      return accumulator;
    },
    {
      SENT: 0,
      DELIVERED: 0,
      FAILED: 0,
      OPENED: 0,
      READ: 0,
      CLICKED: 0,
      PURCHASED: 0,
    }
  );

  const channelPerformance = events.reduce(
    (accumulator, event) => {
      const entry = accumulator[event.channel];
      if (event.eventType === "DELIVERED") entry.delivered += 1;
      if (event.eventType === "OPENED") entry.opened += 1;
      if (event.eventType === "CLICKED") entry.clicked += 1;
      if (event.eventType === "PURCHASED") entry.purchased += 1;
      return accumulator;
    },
    emptyChannelPerformance()
  );

  const totalRevenue = events
    .filter((event) => event.eventType === "PURCHASED")
    .reduce((sum, event) => sum + event.amountImpact, 0);

  const delivered = Math.max(funnel.DELIVERED, 1);
  const openRate = safeDivide(funnel.OPENED, delivered);
  const clickRate = safeDivide(funnel.CLICKED, delivered);
  const purchaseRate = safeDivide(funnel.PURCHASED, delivered);

  const overview: DashboardOverview = {
    customersCount,
    ordersCount,
    campaignsCount,
    activeCampaigns,
    completedCampaigns,
    totalRevenue,
    openRate: Number(openRate.toFixed(2)),
    clickRate: Number(clickRate.toFixed(2)),
    purchaseRate: Number(purchaseRate.toFixed(2)),
    recentCampaigns,
    recentEvents,
    channelPerformance: Object.values(channelPerformance),
  };

  res.status(200).json({
    success: true,
    data: overview,
  });
});
