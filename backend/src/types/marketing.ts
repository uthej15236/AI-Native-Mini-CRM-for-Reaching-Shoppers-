import type {
  CampaignStatus,
  Channel,
  CommunicationEventType,
  LoyaltyTier,
} from "../constants/marketing";

export type { CampaignStatus, Channel, CommunicationEventType, LoyaltyTier } from "../constants/marketing";

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

export interface CustomerRecord extends CustomerPreview {
  tags: string[];
}

export interface OrderRecord {
  orderId: string;
  customerId: string;
  amount: number;
  category: string;
  timestamp: string;
}

export interface CampaignMessages {
  whatsapp: string;
  sms: string;
  email: string;
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

export interface CampaignWorkflowStep {
  label: string;
  detail: string;
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
  messages: CampaignMessages;
  estimatedMetrics: {
    audienceReached: number;
    openRate: number;
    clickRate: number;
    estimatedRevenueImpact: number;
  };
  workflow: CampaignWorkflowStep[];
}

export interface CampaignMetricSnapshot {
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
  funnel: CampaignMetricSnapshot;
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
  messages: CampaignMessages;
  status: CampaignStatus;
  metrics: CampaignMetricSnapshot;
  summary: CampaignSummary | null;
  idempotencyKey: string;
  launchedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
