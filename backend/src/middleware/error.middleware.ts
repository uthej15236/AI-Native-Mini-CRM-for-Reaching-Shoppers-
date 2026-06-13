import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/appError";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details ?? null,
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      message: "Database validation failed",
      details: err.errors,
    });
  }

  const maybeMongoServerError = err as { code?: number; message?: string };
  if (maybeMongoServerError.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate value found",
      details: maybeMongoServerError.message ?? null,
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

