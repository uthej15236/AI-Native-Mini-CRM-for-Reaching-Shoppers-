import type { RequestHandler } from "express";
import { Campaign } from "../models/Campaign";
import { CommunicationEvent } from "../models/CommunicationEvent";
import { buildCampaignPlan } from "../services/copilot.service";
import { launchChannelSimulation } from "../services/channelClient.service";
import { asyncHandler } from "../utils/asyncHandler";
import { createCode, createIdempotencyKey } from "../utils/ids";
import { env } from "../config/env";
import { recomputeCampaignSummary } from "../services/campaignSummary.service";
import { AppError } from "../utils/appError";

export const getCampaigns: RequestHandler = asyncHandler(async (_req, res) => {
  const campaigns = await Campaign.find().sort({ updatedAt: -1 }).lean();

  res.status(200).json({
    success: true,
    data: campaigns,
  });
});

export const getCampaignById: RequestHandler = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOne({ campaignId: req.params.campaignId }).lean();
  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  res.status(200).json({
    success: true,
    data: campaign,
  });
});

export const getCampaignEvents: RequestHandler = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOne({ campaignId: req.params.campaignId });
  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  const events = await CommunicationEvent.find({ campaign: campaign._id })
    .sort({ timestamp: 1 })
    .populate("customer", "customerCode name email city preferredChannel totalSpend lastOrderDate loyaltyTier")
    .lean();

  res.status(200).json({
    success: true,
    data: events,
  });
});

export const launchCampaign: RequestHandler = asyncHandler(async (req, res) => {
  const { objective } = req.body as { objective: string };
  const plan = await buildCampaignPlan(objective);
  const campaignId = createCode("CAMP");
  const idempotencyKey = createIdempotencyKey("campaign");

  const campaign = await Campaign.create({
    campaignId,
    objective: plan.objective,
    intent: plan.intent,
    audienceDefinition: plan.audienceDefinition,
    audienceRuleText: plan.audienceRuleText,
    audienceCustomerIds: plan.audienceCustomerIds,
    audiencePreview: plan.audiencePreview.map((customer) => ({
      customerId: customer.customerId,
      customerCode: customer.customerCode,
      name: customer.name,
      email: customer.email,
      preferredChannel: customer.preferredChannel,
      totalSpend: customer.totalSpend,
      lastOrderDate: new Date(customer.lastOrderDate),
      city: customer.city,
    })),
    recommendedChannel: plan.recommendedChannel,
    offer: plan.offer,
    reasoning: plan.reasoning,
    messages: plan.messages,
    status: "RUNNING",
    metrics: {
      sent: 0,
      delivered: 0,
      failed: 0,
      opened: 0,
      read: 0,
      clicked: 0,
      purchased: 0,
    },
    summary: null,
    idempotencyKey,
    launchedAt: new Date(),
    completedAt: null,
  });

  try {
    await launchChannelSimulation({
      campaignId,
      objective: plan.objective,
      recommendedChannel: plan.recommendedChannel,
      audience: plan.audiencePreview,
      messages: plan.messages,
      idempotencyKey,
    });
  } catch (error) {
    campaign.status = "FAILED";
    campaign.summary = {
      audienceReached: 0,
      openRate: 0,
      clickRate: 0,
      estimatedRevenueImpact: 0,
      recommendations: ["The channel service could not be reached. Check the simulator service and retry."],
      funnel: campaign.metrics,
    };
    await campaign.save();
    throw error;
  }

  res.status(201).json({
    success: true,
    message: "Campaign launched",
    data: {
      campaign,
      plan,
    },
  });
});

export const completeCampaign = async (campaignId: string) => {
  return recomputeCampaignSummary(campaignId);
};

