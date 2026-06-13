export const USER_ROLE_VALUES = ["admin", "sales"] as const;
export type UserRole = (typeof USER_ROLE_VALUES)[number];

export interface JwtPayload {
  id: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

