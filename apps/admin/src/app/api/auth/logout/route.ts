import { getServerSession } from "next-auth/next";

import { RATE_LIMIT_TIER, withRateLimit } from "@repo/api-routes";
import type { RouteHandler } from "@repo/api-routes";
import { iamAuthService } from "@repo/api-server/iam";
import { createLogoutHandler } from "@repo/auth";

import { authOptions } from "@app/lib/server/auth";

const logoutHandler = createLogoutHandler({
  getSession: () => getServerSession(authOptions),
  incrementTokenVersion: iamAuthService.incrementTokenVersion,
});

export const GET = withRateLimit(logoutHandler as unknown as RouteHandler, RATE_LIMIT_TIER.AUTH);
