import type { RequestHandler } from "express";
import { buildCampaignPlan } from "../services/copilot.service";
import { asyncHandler } from "../utils/asyncHandler";

export const planCampaign: RequestHandler = asyncHandler(async (req, res) => {
  const { objective } = req.body as { objective: string };
  const plan = await buildCampaignPlan(objective);

  res.status(200).json({
    success: true,
    message: "Copilot plan ready",
    data: plan,
  });
});

