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

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;

    if (hostname.endsWith(".netlify.app")) {
      const slug = hostname.replace(/\.netlify\.app$/i, "");
      return `${protocol}//${slug}.onrender.com/api`;
    }

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:5000/api`;
    }
  }

  return "http://localhost:5000/api";
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
