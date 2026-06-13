import { model, Schema, type Types } from "mongoose";

export interface OrderDocument {
  orderId: string;
  customer: Types.ObjectId;
  amount: number;
  category: string;
  timestamp: Date;
}

const orderSchema = new Schema<OrderDocument>({
  orderId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    required: true,
    index: true,
  },
});

orderSchema.index({ customer: 1, timestamp: -1 });

export const Order = model<OrderDocument>("Order", orderSchema);

