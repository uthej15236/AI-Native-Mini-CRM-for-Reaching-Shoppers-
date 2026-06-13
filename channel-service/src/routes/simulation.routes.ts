import { Router } from "express";
import { launchSimulation } from "../controllers/simulation.controller";

const router = Router();

router.post("/", launchSimulation);

export default router;

