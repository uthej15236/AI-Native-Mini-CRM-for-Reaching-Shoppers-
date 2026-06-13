import type { Types } from "mongoose";
import { Campaign } from "../models/Campaign";
import { CommunicationEvent } from "../models/CommunicationEvent";
import { Customer, type CustomerDocument } from "../models/Customer";
import { Order, type OrderDocument } from "../models/Order";
import { CHANNELS, EVENT_SEQUENCE, type Channel } from "../constants/marketing";
import type {
  CampaignPlan,
  CampaignWorkflowStep,
  CustomerPreview,
} from "../types/marketing";
import {
  clamp,
  daysBetween,
  normalizeObjective,
  percentile,
  safeDivide,
} from "../utils/marketing";

type CustomerRow = CustomerDocument & { _id: Types.ObjectId };
type OrderRow = OrderDocument & { _id: Types.ObjectId };
type ChannelPerformance = Record<
  Channel,
  {
    delivered: number;
    opened: number;
    clicked: number;
    purchased: number;
  }
>;

interface ParsedGoalWindow {
  recentWindowDays: number;
  inactiveWindowDays: number;
  spendThreshold: number;
  minimumOrders: number;
}

const messageTone = {
  opener: "warm",
  body: "confident",
  CTA: "direct",
} as const;

const inferIntent = (objective: string): string => {
  if (objective.includes("repeat") || objective.includes("return") || objective.includes("reorder")) {
    return "repeat-purchase recovery";
  }

  if (objective.includes("dormant") || objective.includes("win back") || objective.includes("reactivate")) {
    return "dormant-customer recovery";
  }

  if (objective.includes("vip") || objective.includes("high spend") || objective.includes("premium")) {
    return "vip expansion";
  }

  if (objective.includes("new customer") || objective.includes("first order") || objective.includes("onboard")) {
    return "first-order conversion";
  }

  if (objective.includes("bundle") || objective.includes("cross sell")) {
    return "cross-sell";
  }

  return "growth campaign";
};

const parseWindow = (objective: string): ParsedGoalWindow => {
  const recentWindowMatch = objective.match(/last\s+(\d+)\s+days?/i);
  const inactiveWindowMatch = objective.match(/not returned in\s+(\d+)\s+days?/i);
  const inactivityFallbackMatch = objective.match(/(dormant|inactive|quiet)\s+for\s+(\d+)\s+days?/i);
  const spendThresholdMatch = objective.match(/(?:above|over|more than|greater than)\s+\$?(\d[\d,]*)/i);

  const recentWindowDays = recentWindowMatch ? Number(recentWindowMatch[1]) : 90;
  const inactiveWindowDays = inactiveWindowMatch
    ? Number(inactiveWindowMatch[1])
    : inactivityFallbackMatch
      ? Number(inactivityFallbackMatch[2])
      : 30;

  const spendThreshold = spendThresholdMatch
    ? Number(spendThresholdMatch[1].replaceAll(",", ""))
    : 0;

  return {
    recentWindowDays,
    inactiveWindowDays,
    spendThreshold,
    minimumOrders: objective.includes("repeat") || objective.includes("return") ? 2 : 1,
  };
};

const computeChannelPerformance = (events: Array<{ channel: Channel; eventType: string }>): ChannelPerformance => {
  return CHANNELS.reduce<ChannelPerformance>(
    (accumulator, channel) => {
      accumulator[channel] = {
        delivered: 0,
        opened: 0,
        clicked: 0,
        purchased: 0,
      };
      return accumulator;
    },
    {} as ChannelPerformance
  );
};

const buildAudiencePreview = (
  customers: CustomerRow[],
  ordersByCustomer: Map<string, number>,
  objectiveText: string,
  windows: ParsedGoalWindow
): CustomerPreview[] => {
  const now = new Date();
  const isWinBack = objectiveText.includes("repeat") || objectiveText.includes("return") || objectiveText.includes("dormant");
  const isVip = objectiveText.includes("vip") || objectiveText.includes("high spend") || objectiveText.includes("premium");
  const isNewCustomer = objectiveText.includes("new customer") || objectiveText.includes("first order") || objectiveText.includes("onboard");
  const spendThreshold = windows.spendThreshold > 0 ? windows.spendThreshold : percentile(customers.map((customer) => customer.totalSpend), 75);
  const minimumOrders = windows.minimumOrders;

  const scored = customers
    .map((customer) => {
      const orderCount = ordersByCustomer.get(customer._id.toString()) ?? 0;
      const daysSinceLastOrder = daysBetween(now, customer.lastOrderDate);
      const spendScore = customer.totalSpend / 1000;
      const recencyScore = Math.max(0, 120 - daysSinceLastOrder) / 20;
      const channelAffinity = customer.preferredChannel === "WhatsApp" ? 4 : customer.preferredChannel === "Email" ? 3 : 2;
      const orderVolumeScore = orderCount * 1.8;

      let score = spendScore + recencyScore + channelAffinity + orderVolumeScore;

      if (isWinBack) {
        score += daysSinceLastOrder >= windows.inactiveWindowDays && daysSinceLastOrder <= windows.recentWindowDays ? 10 : -3;
      }

      if (isVip) {
        score += customer.totalSpend >= spendThreshold ? 10 : -2;
      }

      if (isNewCustomer) {
        score += orderCount <= 2 ? 7 : -4;
      }

      if (orderCount >= minimumOrders) {
        score += 4;
      }

      const matches = (() => {
        if (isVip) {
          return customer.totalSpend >= spendThreshold;
        }

        if (isNewCustomer) {
          return orderCount <= 2;
        }

        if (isWinBack) {
          return daysSinceLastOrder >= windows.inactiveWindowDays && daysSinceLastOrder <= windows.recentWindowDays;
        }

        return score > 8;
      })();

      return {
        customer,
        orderCount,
        daysSinceLastOrder,
        score,
        matches,
      };
    })
    .sort((left, right) => right.score - left.score);

  const matched = scored.filter((entry) => entry.matches);
  const picked = matched.length > 0 ? matched : scored.slice(0, Math.min(8, scored.length));

  return picked.slice(0, 6).map((entry) => ({
    customerId: entry.customer._id.toString(),
    customerCode: entry.customer.customerCode,
    name: entry.customer.name,
    email: entry.customer.email,
    phone: entry.customer.phone,
    preferredChannel: entry.customer.preferredChannel,
    totalSpend: entry.customer.totalSpend,
    lastOrderDate: entry.customer.lastOrderDate.toISOString(),
    city: entry.customer.city,
    loyaltyTier: entry.customer.loyaltyTier,
    daysSinceLastOrder: entry.daysSinceLastOrder,
    orderCount: entry.orderCount,
  }));
};

const chooseChannel = (
  audience: CustomerPreview[],
  performance: ChannelPerformance,
  objectiveText: string
): { channel: Channel; reason: string } => {
  const preferenceTotals = audience.reduce<Record<Channel, number>>(
    (accumulator, customer) => {
      accumulator[customer.preferredChannel] += 1;
      return accumulator;
    },
    {
      WhatsApp: 0,
      SMS: 0,
      Email: 0,
    }
  );

  const performanceScores = CHANNELS.map((channel) => {
    const metrics = performance[channel];
    const delivered = Math.max(metrics.delivered, 1);
    const engagementRate = (metrics.opened + metrics.clicked * 1.2 + metrics.purchased * 1.6) / delivered;
    const affinity = audience.length === 0 ? 0 : preferenceTotals[channel] / audience.length;
    const urgencyBoost = objectiveText.includes("today") || objectiveText.includes("urgent") ? (channel === "SMS" ? 0.18 : 0) : 0;
    const richContentBoost = objectiveText.includes("story") || objectiveText.includes("showcase") ? (channel === "Email" ? 0.12 : 0) : 0;
    const channelBias = channel === "WhatsApp" ? 0.08 : channel === "SMS" ? 0.03 : 0.02;

    return {
      channel,
      score: engagementRate * 0.45 + affinity * 0.4 + channelBias + urgencyBoost + richContentBoost,
    };
  });

  const ranked = performanceScores.sort((left, right) => right.score - left.score);
  const winner = ranked[0] ?? { channel: "WhatsApp" as Channel, score: 0 };
  const audienceAffinity = preferenceTotals[winner.channel] / Math.max(audience.length, 1);
  const engagementNotes = audience.length > 0
    ? `${Math.round(audienceAffinity * 100)}% of the matched audience already prefers ${winner.channel}.`
    : `Historical engagement makes ${winner.channel} the safest channel.`;

  return {
    channel: winner.channel,
    reason: `${winner.channel} is selected because it balances audience preference, prior engagement, and the objective's tone. ${engagementNotes}`,
  };
};

const craftOffer = (objectiveText: string, audience: CustomerPreview[]): string => {
  const averageSpend =
    audience.length === 0
      ? 0
      : audience.reduce((sum, customer) => sum + customer.totalSpend, 0) / audience.length;

  if (objectiveText.includes("vip") || objectiveText.includes("high spend")) {
    return `VIP early access plus ${averageSpend > 8000 ? "bonus points" : "free shipping"} for the next drop.`;
  }

  if (objectiveText.includes("repeat") || objectiveText.includes("return") || objectiveText.includes("dormant")) {
    return "48-hour comeback offer with a 15% loyalty boost and a short-time free shipping unlock.";
  }

  if (objectiveText.includes("new customer") || objectiveText.includes("first order")) {
    return "Starter bundle with a first-order welcome discount and a low-friction CTA.";
  }

  return "A time-boxed incentive designed to turn curiosity into a purchase without over-discounting.";
};

const craftMessages = (
  objectiveText: string,
  offer: string,
  audience: CustomerPreview[],
  channel: Channel
): CampaignPlan["messages"] => {
  const audienceHook =
    audience.length > 0
      ? `We matched ${audience.length} customers who already show the right buying pattern.`
      : "We found a broad audience that still matches the objective.";

  const firstNamePlaceholder = "{{first_name}}";
  const linePrefix = channel === "Email" ? "subject" : "message";

  return {
    whatsapp: `Hi ${firstNamePlaceholder} - Xeno Copilot spotted a smart re-engagement moment. ${offer} ${audienceHook} Tap to claim it now.`,
    sms: `${firstNamePlaceholder}, Xeno Copilot has a targeted offer for you: ${offer} Reply or tap to redeem. ${objectiveText.includes("vip") ? "Priority access included." : "Limited time."}`,
    email: `Subject: A smart offer picked for ${firstNamePlaceholder}\n\nHi ${firstNamePlaceholder},\n\nXeno Copilot identified you as a strong fit for this campaign. ${offer}\n\n${audienceHook}\n\nWe selected this route because it keeps the message personal, useful, and easy to act on.\n\nCTA: Unlock your offer`,
  };
};

const buildWorkflow = (objectiveText: string, audienceSize: number, channel: Channel): CampaignWorkflowStep[] => {
  return [
    {
      label: "Understand the brief",
      detail: `I interpreted the goal as "${objectiveText}" and translated it into a measurable marketing objective.`,
    },
    {
      label: "Shape the audience",
      detail: `${audienceSize} customers matched the segment logic, with spend and recency acting as the strongest signals.`,
    },
    {
      label: "Choose the channel",
      detail: `${channel} was selected because it best fits the audience's behavior and the campaign's urgency.`,
    },
    {
      label: "Generate copy",
      detail: "I wrote channel-specific variants so the campaign sounds native on each medium, not copy-pasted.",
    },
    {
      label: "Launch and measure",
      detail: "The CRM hands off to the channel simulator, which feeds callbacks back into the campaign event stream.",
    },
  ];
};

const buildReasoning = (
  objectiveText: string,
  audience: CustomerPreview[],
  channelReason: string,
  offer: string
): string[] => {
  const averageSpend =
    audience.length === 0
      ? 0
      : audience.reduce((sum, customer) => sum + customer.totalSpend, 0) / audience.length;

  return [
    `The objective points to a ${inferIntent(objectiveText)} workflow, so the system focused on customers whose last order and spend pattern align with that goal.`,
    `The matched audience centers on ${audience.length} customers with an average spend of $${Math.round(averageSpend).toLocaleString("en-IN")}.`,
    channelReason,
    `The offer is intentionally narrow: ${offer}`,
    "The copy stays personal and short so the copilot feels like a marketer making a decision, not a text generator dumping variations.",
  ];
};

const estimateMetrics = (audience: CustomerPreview[], channel: Channel, objectiveText: string) => {
  const averageSpend =
    audience.length === 0
      ? 0
      : audience.reduce((sum, customer) => sum + customer.totalSpend, 0) / audience.length;
  const intensity = objectiveText.includes("vip") || objectiveText.includes("high spend") ? 1.12 : 1;
  const channelBaseline = {
    WhatsApp: { openRate: 0.72, clickRate: 0.34 },
    SMS: { openRate: 0.61, clickRate: 0.24 },
    Email: { openRate: 0.48, clickRate: 0.19 },
  }[channel];

  return {
    audienceReached: audience.length,
    openRate: clamp(channelBaseline.openRate * intensity, 0.35, 0.92),
    clickRate: clamp(channelBaseline.clickRate * intensity, 0.12, 0.6),
    estimatedRevenueImpact: Math.round(audience.length * averageSpend * 0.06 * intensity),
  };
};

const buildChannelPerformance = (campaigns: Array<{ recommendedChannel: Channel; metrics: { delivered: number; opened: number; clicked: number; purchased: number } }>): ChannelPerformance => {
  const initial: ChannelPerformance = {
    WhatsApp: { delivered: 0, opened: 0, clicked: 0, purchased: 0 },
    SMS: { delivered: 0, opened: 0, clicked: 0, purchased: 0 },
    Email: { delivered: 0, opened: 0, clicked: 0, purchased: 0 },
  };

  campaigns.forEach((campaign) => {
    initial[campaign.recommendedChannel].delivered += campaign.metrics.delivered;
    initial[campaign.recommendedChannel].opened += campaign.metrics.opened;
    initial[campaign.recommendedChannel].clicked += campaign.metrics.clicked;
    initial[campaign.recommendedChannel].purchased += campaign.metrics.purchased;
  });

  return initial;
};

export const buildCampaignPlan = async (objective: string): Promise<CampaignPlan> => {
  const normalizedObjective = normalizeObjective(objective);
  const windows = parseWindow(normalizedObjective);
  const [customers, orders, campaigns, events] = await Promise.all([
    Customer.find({ isDeleted: { $ne: true } }).lean(),
    Order.find().lean(),
    Campaign.find().lean(),
    CommunicationEvent.find().lean(),
  ]);

  const customerRows = customers as CustomerRow[];
  const orderRows = orders as OrderRow[];
  const orderCounts = orderRows.reduce<Map<string, number>>((accumulator, order) => {
    const key = order.customer.toString();
    accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
    return accumulator;
  }, new Map<string, number>());

  const audiencePreview = buildAudiencePreview(customerRows, orderCounts, normalizedObjective, windows);
  const audienceCustomerIds = audiencePreview.map((customer) => customer.customerId);
  const channelPerformance = buildChannelPerformance(campaigns as Array<{ recommendedChannel: Channel; metrics: { delivered: number; opened: number; clicked: number; purchased: number } }>);
  const recommendedChannel = chooseChannel(audiencePreview, channelPerformance, normalizedObjective);
  const offer = craftOffer(normalizedObjective, audiencePreview);
  const messages = craftMessages(normalizedObjective, offer, audiencePreview, recommendedChannel.channel);
  const reasoning = buildReasoning(normalizedObjective, audiencePreview, recommendedChannel.reason, offer);
  const metrics = estimateMetrics(audiencePreview, recommendedChannel.channel, normalizedObjective);
  const workflow = buildWorkflow(normalizedObjective, audiencePreview.length, recommendedChannel.channel);

  const audienceDefinition = [
    `Objective: ${objective}`,
    `Audience rules: customers with the right recency, spend, and order frequency signals.`,
  ].join(" ");

  const audienceRuleText = [
    `last_order_date between ${windows.inactiveWindowDays} and ${windows.recentWindowDays} days ago`,
    `total_spend >= ${windows.spendThreshold > 0 ? windows.spendThreshold : "segment threshold"}`,
  ].join(" AND ");

  const confidence = clamp(
    0.68 + Math.min(audiencePreview.length / 20, 0.16) + (recommendedChannel.channel === "WhatsApp" ? 0.06 : 0.04),
    0.7,
    0.96
  );

  return {
    objective,
    intent: inferIntent(normalizedObjective),
    audienceDefinition,
    audienceRuleText,
    audienceSize: audiencePreview.length,
    audienceCustomerIds,
    audiencePreview,
    recommendedChannel: recommendedChannel.channel,
    channelReason: recommendedChannel.reason,
    offer,
    reasoning,
    confidence: Number(confidence.toFixed(2)),
    messages,
    estimatedMetrics: metrics,
    workflow,
  };
};

export const getCampaignChannelProfile = async (): Promise<ChannelPerformance> => {
  const campaigns = (await Campaign.find().lean()) as Array<{
    recommendedChannel: Channel;
    metrics: { delivered: number; opened: number; clicked: number; purchased: number };
  }>;

  return buildChannelPerformance(campaigns);
};

export const getAudienceOrderCounts = async (customerIds: string[]): Promise<Map<string, number>> => {
  const counts = new Map<string, number>();
  if (customerIds.length === 0) {
    return counts;
  }

  const orders = (await Order.find({ customer: { $in: customerIds } }).lean()) as OrderRow[];
  orders.forEach((order) => {
    const key = order.customer.toString();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return counts;
};
