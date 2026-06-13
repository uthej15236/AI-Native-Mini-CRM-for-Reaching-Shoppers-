import { Router } from "express";
import { seedWorkspace } from "../controllers/demo.controller";

const router = Router();

router.post("/seed", seedWorkspace);

export default router;

