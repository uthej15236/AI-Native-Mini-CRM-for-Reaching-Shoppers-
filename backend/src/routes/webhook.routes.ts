import { Router } from "express";
import { finishCampaign, receiveChannelEvent } from "../controllers/webhook.controller";

const router = Router();

router.post("/channel-event", receiveChannelEvent);
router.post("/channel-finished", finishCampaign);

export default router;

