import { Router } from "express";
import {
  createLead,
  deleteLead,
  exportLeadsCsv,
  getLeadById,
  getLeads,
  updateLead,
} from "../controllers/lead.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import {
  createLeadValidator,
  leadIdValidator,
  listLeadsValidator,
  updateLeadValidator,
} from "../validators/lead.validators";

const router = Router();

router.use(requireAuth);

router.get("/", listLeadsValidator, validateRequest, getLeads);
router.get("/export/csv", listLeadsValidator, validateRequest, exportLeadsCsv);
router.get("/:id", leadIdValidator, validateRequest, getLeadById);
router.post("/", authorizeRoles("admin", "sales"), createLeadValidator, validateRequest, createLead);
router.patch("/:id", authorizeRoles("admin", "sales"), updateLeadValidator, validateRequest, updateLead);
router.delete("/:id", authorizeRoles("admin"), leadIdValidator, validateRequest, deleteLead);

export default router;

