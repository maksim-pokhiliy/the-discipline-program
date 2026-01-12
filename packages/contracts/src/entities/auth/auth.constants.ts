export const AUTH_CONSTANTS = {
  MIN_PASSWORD_LENGTH: 6,
  SESSION_MAX_AGE: 30 * 24 * 60 * 60,
} as const;

export const USER_ROLES = ["USER", "COACH", "ADMIN"] as const;

export const USER_ROLE_ENUM = {
  USER: "USER",
  COACH: "COACH",
  ADMIN: "ADMIN",
} as const;

export const AUTH_ROUTES = {
  LOGIN: "/login",
  LOGOUT: "/logout",
} as const;
