import { model, Schema, type Types } from "mongoose";
import {
  LEAD_SOURCE_VALUES,
  LEAD_STATUS_VALUES,
  type LeadSource,
  type LeadStatus,
} from "../constants/leads";

export interface LeadDocument {
  name: string;
  email: string;
  status: LeadStatus;
  source: LeadSource;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<LeadDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: LEAD_STATUS_VALUES,
      default: "New",
      required: true,
    },
    source: {
      type: String,
      enum: LEAD_SOURCE_VALUES,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

leadSchema.index({ name: "text", email: "text" });

export const Lead = model<LeadDocument>("Lead", leadSchema);

