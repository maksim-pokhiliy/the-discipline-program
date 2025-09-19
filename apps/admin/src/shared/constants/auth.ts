export const AUTH_ROUTES = {
  LOGIN: "/login",
  API_PREFIX: "/api/auth",
} as const;

export const PUBLIC_ROUTES = [AUTH_ROUTES.LOGIN] as const;

export const isPublicRoute = (pathname: string): boolean => {
  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    return true;
  }

  if (pathname.startsWith(AUTH_ROUTES.API_PREFIX)) {
    return true;
  }

  return false;
};
