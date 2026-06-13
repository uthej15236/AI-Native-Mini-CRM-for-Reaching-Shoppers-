import { model, Schema } from "mongoose";
import type { Channel, LoyaltyTier } from "../constants/marketing";

export interface CustomerDocument {
  customerCode: string;
  name: string;
  email: string;
  phone: string;
  preferredChannel: Channel;
  totalSpend: number;
  lastOrderDate: Date;
  city: string;
  loyaltyTier: LoyaltyTier;
  tags: string[];
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<CustomerDocument>(
  {
    customerCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
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
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    preferredChannel: {
      type: String,
      enum: ["WhatsApp", "SMS", "Email"],
      required: true,
    },
    totalSpend: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lastOrderDate: {
      type: Date,
      required: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    loyaltyTier: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Platinum"],
      required: true,
      default: "Bronze",
    },
    tags: {
      type: [String],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ name: "text", email: "text", city: "text", tags: "text" });
customerSchema.index({ totalSpend: -1, lastOrderDate: -1 });
customerSchema.index(
  { customerCode: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: { $ne: true } },
  }
);
customerSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: { $ne: true } },
  }
);

export const Customer = model<CustomerDocument>("Customer", customerSchema);
