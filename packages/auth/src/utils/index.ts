import { AUTH_ROUTES, PUBLIC_ROUTES } from "../constants";

export const isPublicRoute = (pathname: string): boolean => {
  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    return true;
  }

  if (pathname.startsWith(AUTH_ROUTES.API_PREFIX)) {
    return true;
  }

  return false;
};
