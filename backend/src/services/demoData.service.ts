import { Types } from "mongoose";
import { Campaign } from "../models/Campaign";
import { CommunicationEvent } from "../models/CommunicationEvent";
import { Customer, type CustomerDocument } from "../models/Customer";
import { Order } from "../models/Order";
import { buildCampaignSummary } from "./campaignSummary.service";
import { createCode } from "../utils/ids";
import { daysBetween } from "../utils/marketing";
import type { CampaignMetricSnapshot, Channel } from "../types/marketing";

type SeededCustomer = CustomerDocument & { _id: Types.ObjectId };

interface CustomerSeed {
  name: string;
  email: string;
  phone: string;
  preferredChannel: Channel;
  totalSpend: number;
  lastOrderDaysAgo: number;
  city: string;
  loyaltyTier: "Bronze" | "Silver" | "Gold" | "Platinum";
  tags: string[];
}

const customerSeeds: CustomerSeed[] = [
  { name: "Ananya Rao", email: "ananya.rao@northstar.in", phone: "+91 98765 12001", preferredChannel: "WhatsApp", totalSpend: 9200, lastOrderDaysAgo: 18, city: "Bengaluru", loyaltyTier: "Platinum", tags: ["vip", "mobile-first"] },
  { name: "Rohan Mehta", email: "rohan.mehta@northstar.in", phone: "+91 98765 12002", preferredChannel: "Email", totalSpend: 5600, lastOrderDaysAgo: 44, city: "Mumbai", loyaltyTier: "Gold", tags: ["researcher", "newsletter"] },
  { name: "Priya Nair", email: "priya.nair@northstar.in", phone: "+91 98765 12003", preferredChannel: "WhatsApp", totalSpend: 4300, lastOrderDaysAgo: 36, city: "Kochi", loyaltyTier: "Silver", tags: ["repeat-buyer", "fast-convert"] },
  { name: "Kabir Singh", email: "kabir.singh@northstar.in", phone: "+91 98765 12004", preferredChannel: "SMS", totalSpend: 12800, lastOrderDaysAgo: 67, city: "Delhi", loyaltyTier: "Platinum", tags: ["vip", "urgent"] },
  { name: "Aisha Khan", email: "aisha.khan@northstar.in", phone: "+91 98765 12005", preferredChannel: "WhatsApp", totalSpend: 2500, lastOrderDaysAgo: 12, city: "Hyderabad", loyaltyTier: "Silver", tags: ["newish", "mobile-first"] },
  { name: "Meera Iyer", email: "meera.iyer@northstar.in", phone: "+91 98765 12006", preferredChannel: "Email", totalSpend: 7100, lastOrderDaysAgo: 51, city: "Chennai", loyaltyTier: "Gold", tags: ["planner", "email-friendly"] },
  { name: "Arjun Das", email: "arjun.das@northstar.in", phone: "+91 98765 12007", preferredChannel: "SMS", totalSpend: 3800, lastOrderDaysAgo: 95, city: "Kolkata", loyaltyTier: "Silver", tags: ["dormant", "deal-driven"] },
  { name: "Nisha Patel", email: "nisha.patel@northstar.in", phone: "+91 98765 12008", preferredChannel: "WhatsApp", totalSpend: 6400, lastOrderDaysAgo: 29, city: "Ahmedabad", loyaltyTier: "Gold", tags: ["repeat-buyer", "story-led"] },
  { name: "Omar Ali", email: "omar.ali@northstar.in", phone: "+91 98765 12009", preferredChannel: "Email", totalSpend: 1800, lastOrderDaysAgo: 118, city: "Pune", loyaltyTier: "Bronze", tags: ["sleeping", "price-sensitive"] },
  { name: "Simran Joshi", email: "simran.joshi@northstar.in", phone: "+91 98765 12010", preferredChannel: "WhatsApp", totalSpend: 5400, lastOrderDaysAgo: 41, city: "Jaipur", loyaltyTier: "Gold", tags: ["loyal", "mobile-first"] },
  { name: "Tara Kapoor", email: "tara.kapoor@northstar.in", phone: "+91 98765 12011", preferredChannel: "SMS", totalSpend: 9800, lastOrderDaysAgo: 23, city: "Gurgaon", loyaltyTier: "Platinum", tags: ["vip", "flash-sale"] },
  { name: "Vikram Bose", email: "vikram.bose@northstar.in", phone: "+91 98765 12012", preferredChannel: "Email", totalSpend: 3000, lastOrderDaysAgo: 74, city: "Bengaluru", loyaltyTier: "Silver", tags: ["researcher", "seasonal"] },
];

const orderCategories = ["Skincare", "Home", "Fashion", "Fitness", "Travel", "Gadgets"];

const splitSpend = (totalSpend: number, orderCount: number): number[] => {
  const base = Math.max(1, Math.floor(totalSpend / orderCount));
  const values = Array.from({ length: orderCount }, (_, index) => base + index * 70);
  const difference = totalSpend - values.reduce((sum, value) => sum + value, 0);
  values[values.length - 1] += difference;
  return values;
};

const buildMetricSeed = (metrics: CampaignMetricSnapshot, revenueImpact: number) => {
  const summary = buildCampaignSummary(metrics, revenueImpact);
  return { metrics, summary };
};

const seedCampaign = async (
  campaignId: string,
  objective: string,
  intent: string,
  recommendedChannel: Channel,
  audienceIndexes: number[],
  status: "COMPLETED" | "RUNNING",
  metrics: CampaignMetricSnapshot,
  revenueImpact: number
) => {
  const audiencePreview = audienceIndexes.map((index) => {
    const customer = seededCustomers[index];
    return {
      customerId: customer._id.toString(),
      customerCode: customer.customerCode,
      name: customer.name,
      email: customer.email,
      preferredChannel: customer.preferredChannel,
      totalSpend: customer.totalSpend,
      lastOrderDate: customer.lastOrderDate,
      city: customer.city,
    };
  });

  const { summary } = buildMetricSeed(metrics, revenueImpact);
  return Campaign.create({
    campaignId,
    objective,
    intent,
    audienceDefinition: `AI picked ${audiencePreview.length} customers who matched the ${intent} pattern.`,
    audienceRuleText: status === "COMPLETED" ? "seeded campaign data" : "live campaign snapshot",
    audienceCustomerIds: audiencePreview.map((item) => item.customerId),
    audiencePreview,
    recommendedChannel,
    offer: status === "COMPLETED" ? "VIP comeback offer with free shipping." : "Weekend bundle offer with a short urgency window.",
    reasoning: [
      `Seeded campaign for ${intent}.`,
      `Audience leans toward ${recommendedChannel} due to prior engagement.`,
    ],
    messages: {
      whatsapp: "Seeded WhatsApp message",
      sms: "Seeded SMS message",
      email: "Seeded email message",
    },
    status,
    metrics,
    summary,
    idempotencyKey: createCode("SEED"),
    launchedAt: new Date(Date.now() - 86_400_000),
    completedAt: status === "COMPLETED" ? new Date() : null,
  });
};

let seededCustomers: SeededCustomer[] = [];

export const seedDemoData = async (force = true) => {
  if (force) {
    await Promise.all([
      Customer.deleteMany({}),
      Order.deleteMany({}),
      Campaign.deleteMany({}),
      CommunicationEvent.deleteMany({}),
    ]);
  }

  const now = new Date();
  seededCustomers = [];

  for (const [index, seed] of customerSeeds.entries()) {
    const customer = (await Customer.create({
      customerCode: createCode("CUST", index + 1),
      name: seed.name,
      email: seed.email,
      phone: seed.phone,
      preferredChannel: seed.preferredChannel,
      totalSpend: seed.totalSpend,
      lastOrderDate: new Date(now.getTime() - seed.lastOrderDaysAgo * 86_400_000),
      city: seed.city,
      loyaltyTier: seed.loyaltyTier,
      tags: seed.tags,
    })) as SeededCustomer;

    seededCustomers.push(customer);

    const orderCount = seed.lastOrderDaysAgo > 60 ? 3 : 4;
    const amounts = splitSpend(seed.totalSpend, orderCount);

    for (let orderIndex = 0; orderIndex < orderCount; orderIndex += 1) {
      await Order.create({
        orderId: createCode("ORD", index * 10 + orderIndex + 1),
        customer: customer._id,
        amount: amounts[orderIndex],
        category: orderCategories[(index + orderIndex) % orderCategories.length],
        timestamp: new Date(now.getTime() - (seed.lastOrderDaysAgo + orderIndex * 9 + 2) * 86_400_000),
      });
    }
  }

  const completedCampaign = await seedCampaign(
    "CAMP-0001",
    "Re-engage high value customers who bought recently but have not returned in 30 days.",
    "repeat-purchase recovery",
    "WhatsApp",
    [0, 1, 2, 3, 5, 7],
    "COMPLETED",
    { sent: 8, delivered: 7, failed: 1, opened: 6, read: 5, clicked: 3, purchased: 2 },
    18400
  );

  const runningCampaign = await seedCampaign(
    "CAMP-0002",
    "Drive a weekend bundle push for loyal buyers with high intent.",
    "bundle expansion",
    "Email",
    [4, 6, 8, 9, 10],
    "RUNNING",
    { sent: 5, delivered: 4, failed: 1, opened: 2, read: 1, clicked: 1, purchased: 0 },
    2400
  );

  await CommunicationEvent.create([
    {
      communicationId: "COMM-0001",
      campaign: completedCampaign._id,
      customer: seededCustomers[0]._id,
      channel: "WhatsApp",
      eventType: "SENT",
      timestamp: new Date(now.getTime() - 75_000),
      idempotencyKey: "seed-camp-1-sent-1",
      sequence: 1,
      amountImpact: 0,
      source: "manual",
    },
    {
      communicationId: "COMM-0002",
      campaign: completedCampaign._id,
      customer: seededCustomers[0]._id,
      channel: "WhatsApp",
      eventType: "DELIVERED",
      timestamp: new Date(now.getTime() - 72_000),
      idempotencyKey: "seed-camp-1-delivered-1",
      sequence: 2,
      amountImpact: 0,
      source: "manual",
    },
    {
      communicationId: "COMM-0003",
      campaign: completedCampaign._id,
      customer: seededCustomers[0]._id,
      channel: "WhatsApp",
      eventType: "OPENED",
      timestamp: new Date(now.getTime() - 69_000),
      idempotencyKey: "seed-camp-1-opened-1",
      sequence: 3,
      amountImpact: 0,
      source: "manual",
    },
    {
      communicationId: "COMM-0004",
      campaign: completedCampaign._id,
      customer: seededCustomers[0]._id,
      channel: "WhatsApp",
      eventType: "CLICKED",
      timestamp: new Date(now.getTime() - 64_000),
      idempotencyKey: "seed-camp-1-clicked-1",
      sequence: 4,
      amountImpact: 0,
      source: "manual",
    },
    {
      communicationId: "COMM-0005",
      campaign: completedCampaign._id,
      customer: seededCustomers[0]._id,
      channel: "WhatsApp",
      eventType: "PURCHASED",
      timestamp: new Date(now.getTime() - 58_000),
      idempotencyKey: "seed-camp-1-purchased-1",
      sequence: 5,
      amountImpact: 4200,
      source: "manual",
    },
    {
      communicationId: "COMM-0006",
      campaign: runningCampaign._id,
      customer: seededCustomers[4]._id,
      channel: "Email",
      eventType: "SENT",
      timestamp: new Date(now.getTime() - 18_000),
      idempotencyKey: "seed-camp-2-sent-1",
      sequence: 1,
      amountImpact: 0,
      source: "manual",
    },
    {
      communicationId: "COMM-0007",
      campaign: runningCampaign._id,
      customer: seededCustomers[4]._id,
      channel: "Email",
      eventType: "DELIVERED",
      timestamp: new Date(now.getTime() - 15_000),
      idempotencyKey: "seed-camp-2-delivered-1",
      sequence: 2,
      amountImpact: 0,
      source: "manual",
    },
    {
      communicationId: "COMM-0008",
      campaign: runningCampaign._id,
      customer: seededCustomers[4]._id,
      channel: "Email",
      eventType: "OPENED",
      timestamp: new Date(now.getTime() - 12_000),
      idempotencyKey: "seed-camp-2-opened-1",
      sequence: 3,
      amountImpact: 0,
      source: "manual",
    },
  ]);

  return {
    customers: seededCustomers.length,
    campaigns: 2,
    orders: customerSeeds.reduce((sum, seed) => sum + (seed.lastOrderDaysAgo > 60 ? 3 : 4), 0),
    events: 8,
  };
};

export const ensureDemoData = async () => {
  const customerCount = await Customer.countDocuments();
  if (customerCount > 0) {
    return { customers: customerCount, skipped: true };
  }

  return seedDemoData(false);
};
