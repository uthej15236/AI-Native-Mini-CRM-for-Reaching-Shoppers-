import type { RequestHandler } from "express";
import { Types } from "mongoose";
import { createCode } from "../utils/ids";
import { Customer, type CustomerDocument } from "../models/Customer";
import { Order } from "../models/Order";
import { AppError } from "../utils/appError";
import { asyncHandler } from "../utils/asyncHandler";
import { daysBetween } from "../utils/marketing";
import type { CustomerRecord } from "../types/marketing";

type CustomerRow = CustomerDocument & { _id: Types.ObjectId };

const activeCustomerFilter = { isDeleted: { $ne: true } };

const normalizeTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((tag) => String(tag).trim()).filter(Boolean))];
  }

  if (typeof value === "string") {
    return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))];
  }

  return [];
};

const toCustomerRecord = (customer: CustomerRow, orderCount: number, now: Date): CustomerRecord => ({
  customerId: customer._id.toString(),
  customerCode: customer.customerCode,
  name: customer.name,
  email: customer.email,
  phone: customer.phone,
  preferredChannel: customer.preferredChannel,
  totalSpend: customer.totalSpend,
  lastOrderDate: customer.lastOrderDate.toISOString(),
  city: customer.city,
  loyaltyTier: customer.loyaltyTier,
  tags: customer.tags,
  daysSinceLastOrder: daysBetween(now, customer.lastOrderDate),
  orderCount,
});

const buildCustomerUpdate = (body: Record<string, unknown>) => {
  const update: Record<string, unknown> = {};

  if (body.name !== undefined) {
    update.name = String(body.name).trim();
  }

  if (body.email !== undefined) {
    update.email = String(body.email).trim().toLowerCase();
  }

  if (body.phone !== undefined) {
    update.phone = String(body.phone).trim();
  }

  if (body.preferredChannel !== undefined) {
    update.preferredChannel = body.preferredChannel;
  }

  if (body.totalSpend !== undefined) {
    update.totalSpend = Number(body.totalSpend);
  }

  if (body.lastOrderDate !== undefined) {
    update.lastOrderDate = new Date(String(body.lastOrderDate));
  }

  if (body.city !== undefined) {
    update.city = String(body.city).trim();
  }

  if (body.loyaltyTier !== undefined) {
    update.loyaltyTier = body.loyaltyTier;
  }

  if (body.tags !== undefined) {
    update.tags = normalizeTags(body.tags);
  }

  return update;
};

const countOrdersForCustomer = async (customerId: Types.ObjectId) => {
  return Order.countDocuments({ customer: customerId });
};

export const getCustomers: RequestHandler = asyncHandler(async (req, res) => {
  const search = String(req.query.search ?? "").trim();
  const preferredChannel = String(req.query.preferredChannel ?? "").trim();
  const loyaltyTier = String(req.query.loyaltyTier ?? "").trim();
  const sort = String(req.query.sort ?? "recent");

  const filter: Record<string, unknown> = {
    ...activeCustomerFilter,
  };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  if (preferredChannel) {
    filter.preferredChannel = preferredChannel;
  }

  if (loyaltyTier) {
    filter.loyaltyTier = loyaltyTier;
  }

  const [customers, orderSummary] = await Promise.all([
    Customer.find(filter).sort(sort === "spend" ? { totalSpend: -1 } : { lastOrderDate: -1 }).lean(),
    Order.aggregate([
      {
        $group: {
          _id: "$customer",
          orderCount: { $sum: 1 },
          orderSpend: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const orderMap = orderSummary.reduce<Map<string, { orderCount: number; orderSpend: number }>>((accumulator, entry) => {
    accumulator.set(entry._id.toString(), {
      orderCount: entry.orderCount,
      orderSpend: entry.orderSpend,
    });
    return accumulator;
  }, new Map());

  const now = new Date();

  const items = (customers as CustomerRow[]).map((customer) => {
    const orderStats = orderMap.get(customer._id.toString());
    const orderCount = orderStats?.orderCount ?? 0;
    return toCustomerRecord(customer, orderCount, now);
  });

  res.status(200).json({
    success: true,
    data: items,
    meta: {
      totalRecords: items.length,
    },
  });
});

export const getCustomerById: RequestHandler = asyncHandler(async (req, res) => {
  const customerId = String(req.params.customerId);
  const customer = (await Customer.findOne({ _id: customerId, ...activeCustomerFilter }).lean()) as CustomerRow | null;
  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  const orders = await Order.find({ customer: new Types.ObjectId(customerId) })
    .sort({ timestamp: -1 })
    .lean();

  const now = new Date();

  res.status(200).json({
    success: true,
    data: {
      customer: toCustomerRecord(customer, orders.length, now),
      orders: orders.map((order) => ({
        orderId: order.orderId,
        amount: order.amount,
        category: order.category,
        timestamp: order.timestamp.toISOString(),
      })),
    },
  });
});

export const createCustomer: RequestHandler = asyncHandler(async (req, res) => {
  const email = String(req.body.email).trim().toLowerCase();
  const existingCustomer = await Customer.findOne({ email, ...activeCustomerFilter }).lean();
  if (existingCustomer) {
    throw new AppError("Customer already exists with this email", 409);
  }

  const createdCustomer = (await Customer.create({
    customerCode: createCode("CUST"),
    name: String(req.body.name).trim(),
    email,
    phone: String(req.body.phone).trim(),
    preferredChannel: req.body.preferredChannel,
    totalSpend: Number(req.body.totalSpend ?? 0),
    lastOrderDate: new Date(String(req.body.lastOrderDate)),
    city: String(req.body.city).trim(),
    loyaltyTier: req.body.loyaltyTier,
    tags: normalizeTags(req.body.tags),
  })) as CustomerRow;

  const orderCount = await countOrdersForCustomer(createdCustomer._id);

  res.status(201).json({
    success: true,
    message: "Customer created successfully",
    data: toCustomerRecord(createdCustomer, orderCount, new Date()),
  });
});

export const updateCustomer: RequestHandler = asyncHandler(async (req, res) => {
  const customerId = String(req.params.customerId);
  const customer = (await Customer.findOne({ _id: customerId, ...activeCustomerFilter }).lean()) as CustomerRow | null;

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  const update = buildCustomerUpdate(req.body as Record<string, unknown>);

  if (typeof update.email === "string" && update.email !== customer.email) {
    const duplicateEmail = await Customer.findOne({
      email: update.email,
      _id: { $ne: customerId },
      ...activeCustomerFilter,
    }).lean();

    if (duplicateEmail) {
      throw new AppError("Customer already exists with this email", 409);
    }
  }

  const updatedCustomer = (await Customer.findOneAndUpdate(
    { _id: customerId, ...activeCustomerFilter },
    { $set: update },
    {
      new: true,
      runValidators: true,
      context: "query",
    }
  ).lean()) as CustomerRow | null;

  if (!updatedCustomer) {
    throw new AppError("Customer not found", 404);
  }

  const orderCount = await countOrdersForCustomer(updatedCustomer._id);

  res.status(200).json({
    success: true,
    message: "Customer updated successfully",
    data: toCustomerRecord(updatedCustomer, orderCount, new Date()),
  });
});

export const deleteCustomer: RequestHandler = asyncHandler(async (req, res) => {
  const customerId = String(req.params.customerId);
  const deletedCustomer = (await Customer.findOneAndUpdate(
    { _id: customerId, ...activeCustomerFilter },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    },
    {
      new: true,
    }
  ).lean()) as CustomerRow | null;

  if (!deletedCustomer) {
    throw new AppError("Customer not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Customer deleted successfully",
    data: {
      customerId: deletedCustomer._id.toString(),
    },
  });
});
