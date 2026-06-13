import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import campaignRoutes from "./routes/campaign.routes";
import copilotRoutes from "./routes/copilot.routes";
import customerRoutes from "./routes/customer.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import demoRoutes from "./routes/demo.routes";
import webhookRoutes from "./routes/webhook.routes";

const app = express();
const allowedOrigins = new Set(env.clientUrls);
const isLocalOrigin = (origin: string) => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
const isNetlifyOrigin = (origin: string) => /^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin) || isLocalOrigin(origin) || isNetlifyOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: false,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Xeno Copilot API is healthy",
  });
});

app.use("/api/copilot", copilotRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/demo", demoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
