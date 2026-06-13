import dotenv from "dotenv";

dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const parseClientUrls = (): string[] => {
  const rawUrls = process.env.CLIENT_URLS ?? process.env.CLIENT_URL ?? "http://localhost:5173";

  return rawUrls
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
};

const clientUrls = parseClientUrls();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),
  mongoUri: requireEnv("MONGO_URI"),
  clientUrls,
  clientUrl: clientUrls[0] ?? "http://localhost:5173",
  publicApiUrl: process.env.PUBLIC_API_URL ?? "http://localhost:5000/api",
  channelServiceUrl: process.env.CHANNEL_SERVICE_URL ?? "http://localhost:5100/api/simulations",
  webhookSecret: process.env.WEBHOOK_SECRET ?? "xeno-demo-secret",
  simulationSpeed: Number(process.env.SIMULATION_SPEED ?? 0.45),
  jwtSecret: process.env.JWT_SECRET ?? "xeno-demo-jwt-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
};
