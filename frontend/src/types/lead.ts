export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Lost"] as const;
export const LEAD_SOURCES = ["Website", "Instagram", "Referral"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type LeadsSort = "latest" | "oldest";

export interface Lead {
  _id: string;
  name: string;
  email: string;
  status: LeadStatus;
  source: LeadSource;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadFilters {
  page: number;
  status: LeadStatus | "all";
  source: LeadSource | "all";
  search: string;
  sort: LeadsSort;
}

export interface LeadsMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  sort: LeadsSort;
  filters: {
    status: LeadStatus | null;
    source: LeadSource | null;
    search: string | null;
  };
}

export interface LeadMutationPayload {
  name: string;
  email: string;
  status: LeadStatus;
  source: LeadSource;
}

