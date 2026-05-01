import "@repo/auth/types";

import { type NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";

import { UserRole } from "@repo/contracts/iam/auth";
import { ForbiddenError, UnauthorizedError } from "@repo/errors";

import { getMonitoring } from "./monitoring";
import { updateContext } from "./request-context";
import { withErrorHandling } from "./route-helpers";
import type { AuthenticatedHandler, RouteHandler } from "./types";

const bindIdentity = (userId: string, role?: string): void => {
  updateContext({ userId, role });
  getMonitoring()?.setUser({ id: userId, role });
};

const releaseIdentity = (): void => {
  getMonitoring()?.setUser(null);
};

export const createAuthWrappers = (authOptions: NextAuthOptions) => ({
  withAdminAuth: (handler: AuthenticatedHandler): RouteHandler =>
    withErrorHandling(async (request, context) => {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        throw new UnauthorizedError();
      }

      if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.HEAD_COACH) {
        throw new ForbiddenError();
      }

      bindIdentity(session.user.id, session.user.role ?? undefined);

      try {
        return await handler(request, context, session.user.id);
      } finally {
        releaseIdentity();
      }
    }),

  withPlatformAuth: (handler: AuthenticatedHandler): RouteHandler =>
    withErrorHandling(async (request, context) => {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        throw new UnauthorizedError();
      }

      bindIdentity(session.user.id, session.user.role ?? undefined);

      try {
        return await handler(request, context, session.user.id);
      } finally {
        releaseIdentity();
      }
    }),

  withCoachAuth: (handler: AuthenticatedHandler): RouteHandler =>
    withErrorHandling(async (request, context) => {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        throw new UnauthorizedError();
      }

      if (
        session.user.role !== UserRole.COACH &&
        session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.HEAD_COACH
      ) {
        throw new ForbiddenError();
      }

      bindIdentity(session.user.id, session.user.role ?? undefined);

      try {
        return await handler(request, context, session.user.id);
      } finally {
        releaseIdentity();
      }
    }),
});
