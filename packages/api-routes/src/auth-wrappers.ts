import "@repo/auth/types";

import { type NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";

import { UserRole } from "@repo/contracts/iam/auth";
import { ForbiddenError, UnauthorizedError } from "@repo/errors";

import { withErrorHandling } from "./route-helpers";
import type { AuthenticatedHandler, RouteHandler } from "./types";

export const createAuthWrappers = (authOptions: NextAuthOptions) => ({
  withAdminAuth: (handler: AuthenticatedHandler): RouteHandler =>
    withErrorHandling(async (request, context) => {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        throw new UnauthorizedError();
      }

      if (session.user.role !== UserRole.ADMIN) {
        throw new ForbiddenError();
      }

      return await handler(request, context, session.user.id);
    }),

  withPlatformAuth: (handler: AuthenticatedHandler): RouteHandler =>
    withErrorHandling(async (request, context) => {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        throw new UnauthorizedError();
      }

      return await handler(request, context, session.user.id);
    }),

  withCoachAuth: (handler: AuthenticatedHandler): RouteHandler =>
    withErrorHandling(async (request, context) => {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        throw new UnauthorizedError();
      }

      if (session.user.role !== UserRole.COACH && session.user.role !== UserRole.ADMIN) {
        throw new ForbiddenError();
      }

      return await handler(request, context, session.user.id);
    }),
});
