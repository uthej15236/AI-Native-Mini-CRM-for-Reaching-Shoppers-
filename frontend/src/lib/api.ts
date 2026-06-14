import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { getStoredToken } from "./storage";

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const resolveApiBaseUrl = (): string => {
  const explicitBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return trimTrailingSlash(explicitBaseUrl);
  }

  if (import.meta.env.DEV) {
    return "http://localhost:5000/api";
  }

  return "/api";
};

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) {
    if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = new AxiosHeaders(config.headers);
    }
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});
