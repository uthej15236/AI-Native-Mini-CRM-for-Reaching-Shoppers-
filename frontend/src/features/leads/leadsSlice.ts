import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { api } from "../../lib/api";
import { getErrorMessage } from "../../lib/error";
import type { ApiResponse } from "../../types/api";
import type { Lead, LeadFilters, LeadMutationPayload, LeadsMeta } from "../../types/lead";

interface LeadsState {
  items: Lead[];
  selectedLead: Lead | null;
  filters: LeadFilters;
  meta: LeadsMeta;
  status: "idle" | "loading" | "succeeded" | "failed";
  detailsStatus: "idle" | "loading" | "succeeded" | "failed";
  mutationStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  mutationError: string | null;
}

const initialFilters: LeadFilters = {
  page: 1,
  status: "all",
  source: "all",
  search: "",
  sort: "latest",
};

const initialMeta: LeadsMeta = {
  page: 1,
  limit: 10,
  totalRecords: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
  sort: "latest",
  filters: {
    status: null,
    source: null,
    search: null,
  },
};

const initialState: LeadsState = {
  items: [],
  selectedLead: null,
  filters: initialFilters,
  meta: initialMeta,
  status: "idle",
  detailsStatus: "idle",
  mutationStatus: "idle",
  error: null,
  mutationError: null,
};

const parseMeta = (meta: unknown): LeadsMeta => {
  if (!meta || typeof meta !== "object") {
    return initialMeta;
  }
  return meta as LeadsMeta;
};

export const fetchLeads = createAsyncThunk<
  { items: Lead[]; meta: LeadsMeta },
  void,
  { state: RootState; rejectValue: string }
>("leads/fetchLeads", async (_, { getState, rejectWithValue }) => {
  try {
    const { filters } = getState().leads;
    const params = {
      page: filters.page,
      sort: filters.sort,
      status: filters.status === "all" ? undefined : filters.status,
      source: filters.source === "all" ? undefined : filters.source,
      search: filters.search.trim() || undefined,
    };

    const response = await api.get<ApiResponse<Lead[]>>("/leads", { params });
    return {
      items: response.data.data,
      meta: parseMeta(response.data.meta),
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to fetch leads"));
  }
});

export const fetchLeadById = createAsyncThunk<Lead, string, { rejectValue: string }>(
  "leads/fetchLeadById",
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<Lead>>(`/leads/${leadId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch lead details"));
    }
  }
);

export const createLead = createAsyncThunk<Lead, LeadMutationPayload, { rejectValue: string }>(
  "leads/createLead",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<Lead>>("/leads", payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to create lead"));
    }
  }
);

export const updateLead = createAsyncThunk<
  Lead,
  { leadId: string; payload: LeadMutationPayload },
  { rejectValue: string }
>("leads/updateLead", async ({ leadId, payload }, { rejectWithValue }) => {
  try {
    const response = await api.patch<ApiResponse<Lead>>(`/leads/${leadId}`, payload);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to update lead"));
  }
});

export const deleteLead = createAsyncThunk<string, string, { rejectValue: string }>(
  "leads/deleteLead",
  async (leadId, { rejectWithValue }) => {
    try {
      await api.delete(`/leads/${leadId}`);
      return leadId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to delete lead"));
    }
  }
);

const leadsSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<LeadFilters>>) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
    resetFilters: (state) => {
      state.filters = initialFilters;
    },
    clearSelectedLead: (state) => {
      state.selectedLead = null;
    },
    clearLeadsError: (state) => {
      state.error = null;
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load leads";
      })
      .addCase(fetchLeadById.pending, (state) => {
        state.detailsStatus = "loading";
      })
      .addCase(fetchLeadById.fulfilled, (state, action) => {
        state.detailsStatus = "succeeded";
        state.selectedLead = action.payload;
      })
      .addCase(fetchLeadById.rejected, (state, action) => {
        state.detailsStatus = "failed";
        state.error = action.payload ?? "Failed to fetch lead details";
      })
      .addCase(createLead.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(createLead.fulfilled, (state) => {
        state.mutationStatus = "succeeded";
      })
      .addCase(createLead.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload ?? "Failed to create lead";
      })
      .addCase(updateLead.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.selectedLead = action.payload;
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload ?? "Failed to update lead";
      })
      .addCase(deleteLead.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.items = state.items.filter((lead) => lead._id !== action.payload);
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload ?? "Failed to delete lead";
      });
  },
});

export const { setFilters, resetFilters, clearSelectedLead, clearLeadsError } = leadsSlice.actions;
export default leadsSlice.reducer;

