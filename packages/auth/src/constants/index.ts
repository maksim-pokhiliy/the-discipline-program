export const AUTH_ROUTES = {
  LOGIN: "/login",
  API_PREFIX: "/api/auth",
} as const;

export const PUBLIC_ROUTES = [AUTH_ROUTES.LOGIN] as const;
