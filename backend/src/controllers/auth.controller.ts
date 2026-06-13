import bcrypt from "bcryptjs";
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import type { JwtPayload, UserRole } from "../types/auth";
import { AppError } from "../utils/appError";
import { asyncHandler } from "../utils/asyncHandler";

const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
};

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body as {
    fullName: string;
    email: string;
    password: string;
    role?: UserRole;
  };

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("User already exists with this email", 409);
  }

  const user = await User.create({
    fullName,
    email,
    password,
    role: role ?? "sales",
  });

  const token = signToken({ id: user.id, role: user.role });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      token,
      user: user.toJSON(),
    },
  });
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken({ id: user.id, role: user.role });
  const userJson = user.toObject();
  delete (userJson as { password?: string }).password;

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: userJson,
    },
  });
});

export const me: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    data: user.toJSON(),
  });
});
