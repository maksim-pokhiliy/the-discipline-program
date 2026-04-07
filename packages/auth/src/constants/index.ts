export { UserRole } from "@repo/contracts/auth";

export const AUTH_ROUTES = {
  LOGIN: "/login",
  API_PREFIX: "/api/auth",
} as const;

export const PUBLIC_ROUTES = [AUTH_ROUTES.LOGIN] as const;

export const SESSION_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
] as const;
