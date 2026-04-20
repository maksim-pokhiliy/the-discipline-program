import { AUTH_ROUTES, PUBLIC_ROUTE_PREFIXES, PUBLIC_ROUTES } from "../constants";

export const isPublicRoute = (pathname: string): boolean =>
  PUBLIC_ROUTES.some((route) => pathname === route) ||
  PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
  pathname === AUTH_ROUTES.API_PREFIX ||
  pathname.startsWith(AUTH_ROUTES.API_PREFIX + "/");
