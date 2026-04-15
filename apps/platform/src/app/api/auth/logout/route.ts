import { RATE_LIMIT_TIER, withRateLimit } from "@repo/api-routes";
import type { RouteHandler } from "@repo/api-routes";
import { logoutHandler } from "@repo/auth";

export const GET = withRateLimit(logoutHandler as unknown as RouteHandler, RATE_LIMIT_TIER.AUTH);
