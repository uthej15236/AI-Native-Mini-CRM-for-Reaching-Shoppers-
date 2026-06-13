import { model, Schema, type Types } from "mongoose";
import type { Channel, CommunicationEventType } from "../constants/marketing";

export interface CommunicationEventDocument {
  communicationId: string;
  campaign: Types.ObjectId;
  customer: Types.ObjectId;
  channel: Channel;
  eventType: CommunicationEventType;
  timestamp: Date;
  idempotencyKey: string;
  sequence: number;
  amountImpact: number;
  source: "channel-service" | "manual";
  createdAt: Date;
  updatedAt: Date;
}

const communicationEventSchema = new Schema<CommunicationEventDocument>(
  {
    communicationId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    campaign: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ["WhatsApp", "SMS", "Email"],
      required: true,
    },
    eventType: {
      type: String,
      enum: ["SENT", "DELIVERED", "FAILED", "OPENED", "READ", "CLICKED", "PURCHASED"],
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    sequence: {
      type: Number,
      required: true,
    },
    amountImpact: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      enum: ["channel-service", "manual"],
      default: "channel-service",
    },
  },
  {
    timestamps: true,
  }
);

communicationEventSchema.index({ campaign: 1, timestamp: 1 });
communicationEventSchema.index({ campaign: 1, customer: 1, eventType: 1 });

export const CommunicationEvent = model<CommunicationEventDocument>(
  "CommunicationEvent",
  communicationEventSchema
);

