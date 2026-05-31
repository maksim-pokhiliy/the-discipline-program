import type { NextRequest } from "next/server";
import NextAuth from "next-auth";

import { RATE_LIMIT_TIER, withAuthCredentialsRateLimit } from "@repo/api-routes";
import type { RouteHandler } from "@repo/api-routes";

import { authOptions } from "@app/lib/server/auth";

const handler = NextAuth(authOptions);

type NextAuthRouteHandler = (
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
) => Promise<Response>;

export { handler as GET };
export const POST = withAuthCredentialsRateLimit(
  handler as unknown as RouteHandler,
  RATE_LIMIT_TIER.AUTH,
) as unknown as NextAuthRouteHandler;
