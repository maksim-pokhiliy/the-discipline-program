export const AUTH_ROUTES = {
  LOGIN: "/login",
  API_PREFIX: "/api/auth",
  LOGOUT: "/api/auth/logout",
} as const;

export const PUBLIC_ROUTES = [AUTH_ROUTES.LOGIN, "/invite"] as const;

export const PUBLIC_ROUTE_PREFIXES = ["/invite/"] as const;

export const SESSION_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
] as const;
