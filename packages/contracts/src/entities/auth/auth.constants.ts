export const AUTH_CONSTANTS = {
  MIN_PASSWORD_LENGTH: 6,
  SESSION_MAX_AGE: 30 * 24 * 60 * 60,
} as const;

export enum UserRole {
  USER = "USER",
  COACH = "COACH",
  ADMIN = "ADMIN",
}

export const AUTH_ROUTES = {
  LOGIN: "/login",
  LOGOUT: "/logout",
} as const;
