import { type RouteHandler } from "./types";

export const CACHE_POLICY = {
  STATIC: "public, s-maxage=300, stale-while-revalidate=60",
  DYNAMIC_LIST: "public, s-maxage=60, stale-while-revalidate=30",
} as const;

export const withCacheControl =
  (handler: RouteHandler, policy: string): RouteHandler =>
  async (request, context) => {
    const response = await handler(request, context);

    response.headers.set("Cache-Control", policy);

    return response;
  };
