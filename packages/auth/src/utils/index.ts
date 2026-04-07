import { AUTH_ROUTES, PUBLIC_ROUTES } from "../constants";

export const isPublicRoute = (pathname: string): boolean =>
  PUBLIC_ROUTES.some((route) => pathname === route) || pathname.startsWith(AUTH_ROUTES.API_PREFIX);
