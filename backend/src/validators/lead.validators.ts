import { body, param, query } from "express-validator";
import { LEAD_SOURCE_VALUES, LEAD_STATUS_VALUES } from "../constants/leads";

export const createLeadValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("Name must be 2-120 characters"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("status")
    .optional()
    .isIn([...LEAD_STATUS_VALUES])
    .withMessage("Invalid status value"),
  body("source")
    .notEmpty()
    .withMessage("Source is required")
    .isIn([...LEAD_SOURCE_VALUES])
    .withMessage("Invalid source value"),
];

export const updateLeadValidator = [
  param("id").isMongoId().withMessage("Invalid lead id"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Name must be 2-120 characters"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),
  body("status")
    .optional()
    .isIn([...LEAD_STATUS_VALUES])
    .withMessage("Invalid status value"),
  body("source")
    .optional()
    .isIn([...LEAD_SOURCE_VALUES])
    .withMessage("Invalid source value"),
];

export const leadIdValidator = [param("id").isMongoId().withMessage("Invalid lead id")];

export const listLeadsValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
  query("status")
    .optional()
    .isIn([...LEAD_STATUS_VALUES])
    .withMessage("Invalid status filter"),
  query("source")
    .optional()
    .isIn([...LEAD_SOURCE_VALUES])
    .withMessage("Invalid source filter"),
  query("search").optional().isString().withMessage("search must be text"),
  query("sort")
    .optional()
    .isIn(["latest", "oldest"])
    .withMessage("sort must be latest or oldest"),
];

