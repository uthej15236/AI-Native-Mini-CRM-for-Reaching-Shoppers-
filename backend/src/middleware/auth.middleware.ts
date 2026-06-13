import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { JwtPayload } from "../types/auth";
import { AppError } from "../utils/appError";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Authentication token is required", 401));
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return next(new AppError("Invalid authentication header format", 401));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = { id: payload.id, role: payload.role };
    return next();
  } catch (_error) {
    return next(new AppError("Invalid or expired token", 401));
  }
};

