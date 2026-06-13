import type { AuthUser } from "../types/auth";

const TOKEN_KEYS = ["xeno_token", "gigflow_token"] as const;
const USER_KEYS = ["xeno_user", "gigflow_user"] as const;
const THEME_KEYS = ["xeno_theme", "gigflow_theme"] as const;

const getFirstStoredValue = (keys: readonly string[]): string | null => {
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      return value;
    }
  }

  return null;
};

export const getStoredToken = (): string | null => getFirstStoredValue(TOKEN_KEYS);

export const getStoredUser = (): AuthUser | null => {
  const raw = getFirstStoredValue(USER_KEYS);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const setStoredAuth = (token: string, user: AuthUser): void => {
  localStorage.setItem(TOKEN_KEYS[0], token);
  localStorage.setItem(USER_KEYS[0], JSON.stringify(user));
};

export const clearStoredAuth = (): void => {
  TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  USER_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const getStoredTheme = (): "light" | "dark" => {
  const theme = getFirstStoredValue(THEME_KEYS);
  return theme === "dark" ? "dark" : "light";
};

export const setStoredTheme = (theme: "light" | "dark"): void => {
  localStorage.setItem(THEME_KEYS[0], theme);
};
