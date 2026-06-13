import { model, Schema, type Types } from "mongoose";
import type { CampaignMetricSnapshot, CampaignSummary, Channel } from "../types/marketing";

export interface CampaignAudiencePreview {
  customerId: string;
  customerCode: string;
  name: string;
  email: string;
  preferredChannel: Channel;
  totalSpend: number;
  lastOrderDate: Date;
  city: string;
}

export interface CampaignDocument {
  campaignId: string;
  objective: string;
  intent: string;
  audienceDefinition: string;
  audienceRuleText: string;
  audienceCustomerIds: Types.ObjectId[];
  audiencePreview: CampaignAudiencePreview[];
  recommendedChannel: Channel;
  offer: string;
  reasoning: string[];
  messages: {
    whatsapp: string;
    sms: string;
    email: string;
  };
  status: "DRAFT" | "PLANNED" | "RUNNING" | "COMPLETED" | "FAILED";
  metrics: CampaignMetricSnapshot;
  summary: CampaignSummary | null;
  idempotencyKey: string;
  launchedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const audiencePreviewSchema = new Schema<CampaignAudiencePreview>(
  {
    customerId: { type: String, required: true },
    customerCode: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    preferredChannel: { type: String, required: true },
    totalSpend: { type: Number, required: true },
    lastOrderDate: { type: Date, required: true },
    city: { type: String, required: true },
  },
  { _id: false }
);

const campaignSchema = new Schema<CampaignDocument>(
  {
    campaignId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    objective: {
      type: String,
      required: true,
      trim: true,
    },
    intent: {
      type: String,
      required: true,
      trim: true,
    },
    audienceDefinition: {
      type: String,
      required: true,
      trim: true,
    },
    audienceRuleText: {
      type: String,
      required: true,
      trim: true,
    },
    audienceCustomerIds: {
      type: [Schema.Types.ObjectId],
      ref: "Customer",
      default: [],
    },
    audiencePreview: {
      type: [audiencePreviewSchema],
      default: [],
    },
    recommendedChannel: {
      type: String,
      enum: ["WhatsApp", "SMS", "Email"],
      required: true,
    },
    offer: {
      type: String,
      required: true,
      trim: true,
    },
    reasoning: {
      type: [String],
      default: [],
    },
    messages: {
      whatsapp: { type: String, required: true },
      sms: { type: String, required: true },
      email: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["DRAFT", "PLANNED", "RUNNING", "COMPLETED", "FAILED"],
      default: "DRAFT",
    },
    metrics: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      purchased: { type: Number, default: 0 },
    },
    summary: {
      type: Schema.Types.Mixed,
      default: null,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    launchedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

campaignSchema.index({ createdAt: -1 });
campaignSchema.index({ status: 1, createdAt: -1 });

export const Campaign = model<CampaignDocument>("Campaign", campaignSchema);

