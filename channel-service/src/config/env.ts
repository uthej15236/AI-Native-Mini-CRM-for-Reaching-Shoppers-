import dotenv from "dotenv";

dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 5100),
  nodeEnv: process.env.NODE_ENV ?? "development",
  webhookSecret: requireEnv("WEBHOOK_SECRET"),
  simulationSpeed: Number(process.env.SIMULATION_SPEED ?? 0.45),
};

