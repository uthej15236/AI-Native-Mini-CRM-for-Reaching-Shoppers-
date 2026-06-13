import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../lib/api";
import { getErrorMessage } from "../../lib/error";
import { clearStoredAuth, getStoredToken, getStoredUser, setStoredAuth } from "../../lib/storage";
import type { ApiResponse } from "../../types/api";
import type { AuthPayload, AuthUser, LoginFormValues, RegisterFormValues } from "../../types/auth";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  initialized: boolean;
  error: string | null;
}

const initialUser = getStoredUser();
const initialToken = getStoredToken();

const initialState: AuthState = {
  user: initialUser,
  token: initialToken,
  status: "idle",
  initialized: !initialToken || Boolean(initialUser),
  error: null,
};

export const registerUser = createAsyncThunk<
  AuthPayload,
  RegisterFormValues,
  { rejectValue: string }
>("auth/registerUser", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post<ApiResponse<AuthPayload>>("/auth/register", payload);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Registration failed"));
  }
});

export const loginUser = createAsyncThunk<AuthPayload, LoginFormValues, { rejectValue: string }>(
  "auth/loginUser",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<AuthPayload>>("/auth/login", payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Login failed"));
    }
  }
);

export const fetchCurrentUser = createAsyncThunk<AuthUser, void, { rejectValue: string }>(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<AuthUser>>("/auth/me");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Session expired. Please sign in again."));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.initialized = true;
      state.error = null;
      clearStoredAuth();
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.initialized = true;
        state.error = null;
        setStoredAuth(action.payload.token, action.payload.user);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Registration failed";
        state.initialized = true;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.initialized = true;
        state.error = null;
        setStoredAuth(action.payload.token, action.payload.user);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Login failed";
        state.initialized = true;
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.initialized = true;
        state.error = null;
        if (state.token) {
          setStoredAuth(state.token, action.payload);
        }
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = "failed";
        state.user = null;
        state.token = null;
        state.initialized = true;
        state.error = action.payload ?? "Unable to restore session";
        clearStoredAuth();
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

