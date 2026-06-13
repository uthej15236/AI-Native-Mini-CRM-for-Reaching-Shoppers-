export type UserRole = "admin" | "sales";

export interface AuthUser {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  token: string;
  user: AuthUser;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues extends LoginFormValues {
  fullName: string;
  role: UserRole;
}

