import type { Channel, CommunicationEventType, CampaignStatus } from "../types/xeno";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compactNumber = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateTime = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const eventLabels: Record<CommunicationEventType, string> = {
  SENT: "Sent",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  OPENED: "Opened",
  READ: "Read",
  CLICKED: "Clicked",
  PURCHASED: "Purchased",
};

const statusLabels: Record<CampaignStatus, string> = {
  DRAFT: "Draft",
  PLANNED: "Planned",
  RUNNING: "Running",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

export const formatCurrency = (value: number) => currency.format(value);

export const formatCompact = (value: number) => compactNumber.format(value);

export const formatDateTime = (value: string) => dateTime.format(new Date(value));

export const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const labelChannel = (channel: Channel) => channel;

export const labelStatus = (status: CampaignStatus) => statusLabels[status];

export const labelEvent = (eventType: CommunicationEventType) => eventLabels[eventType];

export const relativeDays = (days: number) => {
  if (days <= 0) {
    return "Today";
  }

  if (days === 1) {
    return "1 day ago";
  }

  return `${days} days ago`;
};
