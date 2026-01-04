export const AUTH_CONSTANTS = {
  MIN_PASSWORD_LENGTH: 6,
  SESSION_MAX_AGE: 30 * 24 * 60 * 60,
} as const;

export const USER_ROLES = ["ADMIN", "EDITOR"] as const;

export const USER_ROLE_ENUM = {
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
} as const;

export const AUTH_ROUTES = {
  LOGIN: "/login",
  LOGOUT: "/logout",
} as const;
