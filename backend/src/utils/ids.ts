import { randomUUID } from "crypto";

export const createCode = (prefix: string, sequence?: number): string => {
  if (typeof sequence === "number") {
    return `${prefix}-${String(sequence).padStart(4, "0")}`;
  }

  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
};

export const createIdempotencyKey = (prefix: string): string => {
  return `${prefix.toLowerCase()}_${randomUUID()}`;
};

