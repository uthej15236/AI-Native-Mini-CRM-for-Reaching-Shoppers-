import { Router } from "express";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from "../controllers/customer.controller";
import { validateRequest } from "../middleware/validate.middleware";
import {
  createCustomerValidator,
  customerIdValidator,
  updateCustomerValidator,
} from "../validators/customer.validators";

const router = Router();

router.get("/", getCustomers);
router.post("/", createCustomerValidator, validateRequest, createCustomer);
router.get("/:customerId", customerIdValidator, validateRequest, getCustomerById);
router.patch("/:customerId", updateCustomerValidator, validateRequest, updateCustomer);
router.delete("/:customerId", customerIdValidator, validateRequest, deleteCustomer);

export default router;
