export const LEAD_STATUS_VALUES = ["New", "Contacted", "Qualified", "Lost"] as const;
export const LEAD_SOURCE_VALUES = ["Website", "Instagram", "Referral"] as const;
export const LEADS_PAGE_SIZE = 10;

export type LeadStatus = (typeof LEAD_STATUS_VALUES)[number];
export type LeadSource = (typeof LEAD_SOURCE_VALUES)[number];

