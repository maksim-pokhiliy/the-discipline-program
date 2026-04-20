export const AUTH_CONSTANTS = {
  MIN_PASSWORD_LENGTH: 12,
  MAX_PASSWORD_LENGTH: 128,
  BCRYPT_COST_FACTOR: 12,
  SESSION_MAX_AGE: 30 * 24 * 60 * 60,
} as const;

export enum UserRole {
  USER = "USER",
  COACH = "COACH",
  ADMIN = "ADMIN",
}

export const ROLE_HOMES: Record<UserRole, string> = {
  [UserRole.USER]: "/athlete",
  [UserRole.COACH]: "/coach",
  [UserRole.ADMIN]: "/admin",
};

export const FALLBACK_ROLE_HOME = "/login";
