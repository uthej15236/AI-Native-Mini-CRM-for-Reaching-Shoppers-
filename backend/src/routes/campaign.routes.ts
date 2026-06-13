import { Router } from "express";
import {
  getCampaignById,
  getCampaignEvents,
  getCampaigns,
  launchCampaign,
} from "../controllers/campaign.controller";
import { validateRequest } from "../middleware/validate.middleware";
import { body } from "express-validator";

const router = Router();

router.get("/", getCampaigns);
router.get("/:campaignId", getCampaignById);
router.get("/:campaignId/events", getCampaignEvents);
router.post(
  "/launch",
  body("objective").trim().isLength({ min: 10, max: 240 }).withMessage("objective must be between 10 and 240 characters"),
  validateRequest,
  launchCampaign
);

export default router;

