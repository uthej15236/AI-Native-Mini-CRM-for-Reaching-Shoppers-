import type { RequestHandler } from "express";
import { Campaign } from "../models/Campaign";
import { CommunicationEvent } from "../models/CommunicationEvent";
import { env } from "../config/env";
import { EVENT_SEQUENCE, type CommunicationEventType } from "../constants/marketing";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/appError";
import { recomputeCampaignSummary } from "../services/campaignSummary.service";
import type { CampaignMetricSnapshot } from "../types/marketing";

const metricKeyByEventType: Record<CommunicationEventType, keyof CampaignMetricSnapshot> = {
  SENT: "sent",
  DELIVERED: "delivered",
  FAILED: "failed",
  OPENED: "opened",
  READ: "read",
  CLICKED: "clicked",
  PURCHASED: "purchased",
};

const assertWebhookSecret = (secret: string | undefined) => {
  if (secret !== env.webhookSecret) {
    throw new AppError("Invalid webhook secret", 401);
  }
};

export const receiveChannelEvent: RequestHandler = asyncHandler(async (req, res) => {
  assertWebhookSecret(req.header("x-xeno-webhook-secret"));

  const payload = req.body as {
    communicationId: string;
    campaignId: string;
    customerId: string;
    channel: "WhatsApp" | "SMS" | "Email";
    eventType: CommunicationEventType;
    timestamp: string;
    idempotencyKey: string;
    sequence: number;
    amountImpact?: number;
    source?: "channel-service" | "manual";
  };

  const existing = await CommunicationEvent.findOne({ idempotencyKey: payload.idempotencyKey }).lean();
  if (existing) {
    res.status(200).json({
      success: true,
      duplicate: true,
      data: existing,
    });
    return;
  }

  const campaign = await Campaign.findOne({ campaignId: payload.campaignId });
  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  const event = await CommunicationEvent.create({
    communicationId: payload.communicationId,
    campaign: campaign._id,
    customer: payload.customerId,
    channel: payload.channel,
    eventType: payload.eventType,
    timestamp: new Date(payload.timestamp),
    idempotencyKey: payload.idempotencyKey,
    sequence: EVENT_SEQUENCE[payload.eventType] ?? payload.sequence,
    amountImpact: payload.amountImpact ?? 0,
    source: payload.source ?? "channel-service",
  });

  const metricKey = metricKeyByEventType[payload.eventType];
  campaign.metrics[metricKey] += 1;
  campaign.status = "RUNNING";
  await campaign.save();

  res.status(201).json({
    success: true,
    message: "Event stored",
    data: event,
  });
});

export const finishCampaign: RequestHandler = asyncHandler(async (req, res) => {
  assertWebhookSecret(req.header("x-xeno-webhook-secret"));

  const { campaignId } = req.body as { campaignId: string };
  const campaign = await Campaign.findOne({ campaignId });
  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  if (campaign.status === "COMPLETED" && campaign.summary) {
    res.status(200).json({
      success: true,
      duplicate: true,
      data: campaign.summary,
    });
    return;
  }

  const summary = await recomputeCampaignSummary(campaignId);

  res.status(200).json({
    success: true,
    message: "Campaign completed",
    data: summary,
  });
});
