import { Router } from "express";
import { planCampaign } from "../controllers/copilot.controller";
import { validateRequest } from "../middleware/validate.middleware";
import { planCampaignValidator } from "../validators/copilot.validators";

const router = Router();

router.post("/plan", planCampaignValidator, validateRequest, planCampaign);

export default router;

