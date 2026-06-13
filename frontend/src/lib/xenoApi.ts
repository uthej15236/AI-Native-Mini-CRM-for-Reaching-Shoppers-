import type { AxiosResponse } from "axios";
import { api } from "./api";
import type {
  ApiEnvelope,
  CampaignPlan,
  CampaignRecord,
  CampaignTimelineEvent,
  CustomerDeleteResult,
  CustomerDetail,
  CustomerRecord,
  CustomerUpsertPayload,
  DashboardOverview,
  LaunchCampaignResponse,
  Channel,
  LoyaltyTier,
} from "../types/xeno";

interface SeedWorkspaceResponse {
  customers: number;
  campaigns: number;
  orders: number;
  events: number;
}

const unwrap = <T>(response: AxiosResponse<ApiEnvelope<T>>): T => {
  if (!response.data.success) {
    throw new Error(response.data.message ?? "The request could not be completed.");
  }

  return response.data.data;
};

export const xenoApi = {
  getOverview: async (): Promise<DashboardOverview> => {
    return unwrap(await api.get<ApiEnvelope<DashboardOverview>>("/dashboard/overview"));
  },

  getCustomers: async (filters: {
    search?: string;
    preferredChannel?: Channel | "all";
    loyaltyTier?: LoyaltyTier | "all";
  } = {}): Promise<CustomerRecord[]> => {
    const { search, preferredChannel, loyaltyTier } = filters;

    return unwrap(
      await api.get<ApiEnvelope<CustomerRecord[]>>("/customers", {
        params: {
          search: search?.trim() || undefined,
          preferredChannel: preferredChannel && preferredChannel !== "all" ? preferredChannel : undefined,
          loyaltyTier: loyaltyTier && loyaltyTier !== "all" ? loyaltyTier : undefined,
        },
      })
    );
  },

  getCustomerById: async (customerId: string): Promise<CustomerDetail> => {
    return unwrap(await api.get<ApiEnvelope<CustomerDetail>>(`/customers/${customerId}`));
  },

  createCustomer: async (payload: CustomerUpsertPayload): Promise<CustomerRecord> => {
    return unwrap(await api.post<ApiEnvelope<CustomerRecord>>("/customers", payload));
  },

  updateCustomer: async (customerId: string, payload: CustomerUpsertPayload): Promise<CustomerRecord> => {
    return unwrap(await api.patch<ApiEnvelope<CustomerRecord>>(`/customers/${customerId}`, payload));
  },

  deleteCustomer: async (customerId: string): Promise<CustomerDeleteResult> => {
    return unwrap(await api.delete<ApiEnvelope<CustomerDeleteResult>>(`/customers/${customerId}`));
  },

  getCampaigns: async (): Promise<CampaignRecord[]> => {
    return unwrap(await api.get<ApiEnvelope<CampaignRecord[]>>("/campaigns"));
  },

  getCampaignById: async (campaignId: string): Promise<CampaignRecord> => {
    return unwrap(await api.get<ApiEnvelope<CampaignRecord>>(`/campaigns/${campaignId}`));
  },

  getCampaignEvents: async (campaignId: string): Promise<CampaignTimelineEvent[]> => {
    return unwrap(await api.get<ApiEnvelope<CampaignTimelineEvent[]>>(`/campaigns/${campaignId}/events`));
  },

  planCampaign: async (objective: string): Promise<CampaignPlan> => {
    return unwrap(await api.post<ApiEnvelope<CampaignPlan>>("/copilot/plan", { objective }));
  },

  launchCampaign: async (objective: string): Promise<LaunchCampaignResponse> => {
    return unwrap(await api.post<ApiEnvelope<LaunchCampaignResponse>>("/campaigns/launch", { objective }));
  },

  seedWorkspace: async (): Promise<SeedWorkspaceResponse> => {
    return unwrap(await api.post<ApiEnvelope<SeedWorkspaceResponse>>("/demo/seed"));
  },
};
