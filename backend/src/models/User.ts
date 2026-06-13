import bcrypt from "bcryptjs";
import { model, Schema } from "mongoose";
import { USER_ROLE_VALUES, type UserRole } from "../types/auth";

export interface UserDocument {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLE_VALUES,
      default: "sales",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.set("toJSON", {
  transform: (_doc, ret: { password?: string }) => {
    delete ret.password;
    return ret;
  },
});

export const User = model<UserDocument>("User", userSchema);
