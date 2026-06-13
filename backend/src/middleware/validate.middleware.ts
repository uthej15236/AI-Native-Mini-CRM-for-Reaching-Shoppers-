import type { RequestHandler } from "express";
import { validationResult } from "express-validator";
import { AppError } from "../utils/appError";

export const validateRequest: RequestHandler = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError("Validation failed", 400, errors.array()));
  }
  next();
};

