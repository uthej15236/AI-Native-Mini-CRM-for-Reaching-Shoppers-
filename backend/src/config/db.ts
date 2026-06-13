import mongoose from "mongoose";
import { env } from "./env";

export const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(env.mongoUri);
  // Keep this line for quick operational visibility in local/dev logs.
  console.log("Connected to MongoDB");
};

