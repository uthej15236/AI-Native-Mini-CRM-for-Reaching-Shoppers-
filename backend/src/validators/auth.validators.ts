import { body } from "express-validator";
import { USER_ROLE_VALUES } from "../types/auth";

export const registerValidator = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("Full name must be 2-120 characters"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 6, max: 64 })
    .withMessage("Password must be 6-64 characters"),
  body("role")
    .optional()
    .isIn([...USER_ROLE_VALUES])
    .withMessage("Role must be one of: admin, sales"),
];

export const loginValidator = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

