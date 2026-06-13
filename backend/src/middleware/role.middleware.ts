import type { RequestHandler } from "express";
import type { UserRole } from "../types/auth";
import { AppError } from "../utils/appError";

export const authorizeRoles = (...allowedRoles: UserRole[]): RequestHandler => {
  return (req, _res, next) => {
    const user = req.user;
    if (!user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!allowedRoles.includes(user.role)) {
      return next(new AppError("You are not allowed to perform this action", 403));
    }

    return next();
  };
};

