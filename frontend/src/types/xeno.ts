export type Channel = "WhatsApp" | "SMS" | "Email";
export type CampaignStatus = "DRAFT" | "PLANNED" | "RUNNING" | "COMPLETED" | "FAILED";
export type CommunicationEventType =
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "OPENED"
  | "READ"
  | "CLICKED"
  | "PURCHASED";
export type LoyaltyTier = "Bronze" | "Silver" | "Gold" | "Platinum";

export interface CustomerPreview {
  customerId: string;
  customerCode: string;
  name: string;
  email: string;
  phone: string;
  preferredChannel: Channel;
  totalSpend: number;
  lastOrderDate: string;
  city: string;
  loyaltyTier: LoyaltyTier;
  daysSinceLastOrder: number;
  orderCount: number;
}

export interface CampaignAudiencePreview {
  customerId: string;
  customerCode: string;
  name: string;
  email: string;
  preferredChannel: Channel;
  totalSpend: number;
  lastOrderDate: string;
  city: string;
}

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  read: number;
  clicked: number;
  purchased: number;
}

export interface CampaignSummary {
  audienceReached: number;
  openRate: number;
  clickRate: number;
  estimatedRevenueImpact: number;
  recommendations: string[];
  funnel: CampaignMetrics;
}

export interface CampaignPlan {
  objective: string;
  intent: string;
  audienceDefinition: string;
  audienceRuleText: string;
  audienceSize: number;
  audienceCustomerIds: string[];
  audiencePreview: CustomerPreview[];
  recommendedChannel: Channel;
  channelReason: string;
  offer: string;
  reasoning: string[];
  confidence: number;
  messages: {
    whatsapp: string;
    sms: string;
    email: string;
  };
  estimatedMetrics: {
    audienceReached: number;
    openRate: number;
    clickRate: number;
    estimatedRevenueImpact: number;
  };
  workflow: Array<{
    label: string;
    detail: string;
  }>;
}

export interface CampaignRecord {
  campaignId: string;
  objective: string;
  intent: string;
  audienceDefinition: string;
  audienceRuleText: string;
  audienceCustomerIds: string[];
  audiencePreview: CampaignAudiencePreview[];
  recommendedChannel: Channel;
  offer: string;
  reasoning: string[];
  messages: {
    whatsapp: string;
    sms: string;
    email: string;
  };
  status: CampaignStatus;
  metrics: CampaignMetrics;
  summary: CampaignSummary | null;
  idempotencyKey: string;
  launchedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRecord {
  customerId: string;
  customerCode: string;
  name: string;
  email: string;
  phone: string;
  preferredChannel: Channel;
  totalSpend: number;
  lastOrderDate: string;
  city: string;
  loyaltyTier: LoyaltyTier;
  tags: string[];
  daysSinceLastOrder: number;
  orderCount: number;
}

export interface CustomerUpsertPayload {
  name: string;
  email: string;
  phone: string;
  preferredChannel: Channel;
  totalSpend: number;
  lastOrderDate: string;
  city: string;
  loyaltyTier: LoyaltyTier;
  tags: string[];
}

export interface CustomerDeleteResult {
  customerId: string;
}

export interface OrderRecord {
  orderId: string;
  amount: number;
  category: string;
  timestamp: string;
}

export interface CustomerDetail {
  customer: CustomerRecord;
  orders: OrderRecord[];
}

export interface CommunicationEventRecord {
  communicationId: string;
  campaignId: string;
  customerId: string;
  channel: Channel;
  eventType: CommunicationEventType;
  timestamp: string;
  idempotencyKey: string;
  sequence: number;
  amountImpact: number;
  source: "channel-service" | "manual";
}

export interface TimelineCustomer {
  customerCode: string;
  name: string;
  email: string;
  city: string;
  preferredChannel: Channel;
  totalSpend: number;
  lastOrderDate: string;
  loyaltyTier: LoyaltyTier;
}

export interface CampaignTimelineEvent {
  communicationId: string;
  campaignId: string;
  customer: TimelineCustomer;
  channel: Channel;
  eventType: CommunicationEventType;
  timestamp: string;
  idempotencyKey: string;
  sequence: number;
  amountImpact: number;
  source: "channel-service" | "manual";
}

export interface DashboardOverview {
  customersCount: number;
  ordersCount: number;
  campaignsCount: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalRevenue: number;
  openRate: number;
  clickRate: number;
  purchaseRate: number;
  recentCampaigns: CampaignRecord[];
  recentEvents: CommunicationEventRecord[];
  channelPerformance: Array<{
    channel: Channel;
    delivered: number;
    opened: number;
    clicked: number;
    purchased: number;
  }>;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  duplicate?: boolean;
  meta?: {
    totalRecords?: number;
  };
}

export interface CopilotConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  title: string;
  body: string;
  timestamp: string;
}

export interface LaunchCampaignResponse {
  campaign: CampaignRecord;
  plan: CampaignPlan;
}
