import "@repo/auth/types";

import { type NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";

import { UserRole } from "@repo/contracts/auth";
import { ForbiddenError, UnauthorizedError } from "@repo/errors";

import { handleApiError } from "./error-handler";
import type { AuthenticatedHandler, RouteHandler } from "./types";

export const createAuthWrappers = (authOptions: NextAuthOptions) => ({
  withAdminAuth: (handler: RouteHandler): RouteHandler => {
    return async (request, context) => {
      try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
          throw new UnauthorizedError();
        }

        if (session.user.role !== UserRole.ADMIN) {
          throw new ForbiddenError();
        }

        return await handler(request, context);
      } catch (error) {
        return handleApiError(error);
      }
    };
  },

  withPlatformAuth: (handler: AuthenticatedHandler): RouteHandler => {
    return async (request, context) => {
      try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
          throw new UnauthorizedError();
        }

        return await handler(request, context, session.user.id);
      } catch (error) {
        return handleApiError(error);
      }
    };
  },
});
