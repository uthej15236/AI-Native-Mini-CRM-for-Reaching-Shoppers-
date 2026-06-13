export const CHANNELS = ["WhatsApp", "SMS", "Email"] as const;
export const CAMPAIGN_STATUSES = ["DRAFT", "PLANNED", "RUNNING", "COMPLETED", "FAILED"] as const;
export const COMMUNICATION_EVENT_TYPES = [
  "SENT",
  "DELIVERED",
  "FAILED",
  "OPENED",
  "READ",
  "CLICKED",
  "PURCHASED",
] as const;
export const LOYALTY_TIERS = ["Bronze", "Silver", "Gold", "Platinum"] as const;

export type Channel = (typeof CHANNELS)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
export type CommunicationEventType = (typeof COMMUNICATION_EVENT_TYPES)[number];
export type LoyaltyTier = (typeof LOYALTY_TIERS)[number];

export const EVENT_SEQUENCE: Record<CommunicationEventType, number> = {
  FAILED: 0,
  SENT: 1,
  DELIVERED: 2,
  OPENED: 3,
  READ: 4,
  CLICKED: 5,
  PURCHASED: 6,
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  WhatsApp: "WhatsApp",
  SMS: "SMS",
  Email: "Email",
};

