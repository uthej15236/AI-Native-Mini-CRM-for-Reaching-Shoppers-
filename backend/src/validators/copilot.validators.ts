import { body } from "express-validator";

export const planCampaignValidator = [
  body("objective")
    .trim()
    .isLength({ min: 10, max: 240 })
    .withMessage("objective must be between 10 and 240 characters"),
];

