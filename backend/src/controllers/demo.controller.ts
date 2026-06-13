import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { seedDemoData } from "../services/demoData.service";

export const seedWorkspace: RequestHandler = asyncHandler(async (_req, res) => {
  const result = await seedDemoData(true);

  res.status(200).json({
    success: true,
    message: "Demo workspace seeded",
    data: result,
  });
});

