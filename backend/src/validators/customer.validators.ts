import { body, param } from "express-validator";
import { CHANNELS, LOYALTY_TIERS } from "../constants/marketing";

const tagValueValidator = body("tags")
  .optional()
  .custom((value) => typeof value === "string" || Array.isArray(value))
  .withMessage("tags must be a comma-separated string or an array of strings");

export const customerIdValidator = [param("customerId").isMongoId().withMessage("Invalid customer id")];

export const createCustomerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 120 }).withMessage("Name must be 2-120 characters"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("phone").trim().notEmpty().withMessage("Phone number is required").isLength({ min: 7, max: 24 }).withMessage("Phone number must be 7-24 characters"),
  body("preferredChannel")
    .notEmpty()
    .withMessage("Preferred channel is required")
    .isIn([...CHANNELS])
    .withMessage("Invalid preferred channel"),
  body("totalSpend").optional().isFloat({ min: 0 }).withMessage("totalSpend must be a number greater than or equal to 0"),
  body("lastOrderDate").notEmpty().withMessage("Last order date is required").isISO8601().withMessage("lastOrderDate must be a valid ISO date"),
  body("city").trim().notEmpty().withMessage("City is required").isLength({ min: 2, max: 80 }).withMessage("City must be 2-80 characters"),
  body("loyaltyTier")
    .notEmpty()
    .withMessage("Loyalty tier is required")
    .isIn([...LOYALTY_TIERS])
    .withMessage("Invalid loyalty tier"),
  tagValueValidator,
];

export const updateCustomerValidator = [
  ...customerIdValidator,
  body("name").optional().trim().isLength({ min: 2, max: 120 }).withMessage("Name must be 2-120 characters"),
  body("email").optional().trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("phone").optional().trim().isLength({ min: 7, max: 24 }).withMessage("Phone number must be 7-24 characters"),
  body("preferredChannel").optional().isIn([...CHANNELS]).withMessage("Invalid preferred channel"),
  body("totalSpend").optional().isFloat({ min: 0 }).withMessage("totalSpend must be a number greater than or equal to 0"),
  body("lastOrderDate").optional().isISO8601().withMessage("lastOrderDate must be a valid ISO date"),
  body("city").optional().trim().isLength({ min: 2, max: 80 }).withMessage("City must be 2-80 characters"),
  body("loyaltyTier").optional().isIn([...LOYALTY_TIERS]).withMessage("Invalid loyalty tier"),
  tagValueValidator,
];
