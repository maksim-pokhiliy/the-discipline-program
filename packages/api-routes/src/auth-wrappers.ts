import { getServerSession } from "next-auth/next";

import { authOptions } from "@repo/auth/config";
import { ForbiddenError, UnauthorizedError } from "@repo/errors";

import { handleApiError } from "./error-handler";
import type { AuthenticatedHandler, RouteHandler } from "./types";

export type { RouteContext, RouteHandler, AuthenticatedHandler } from "./types";

export const withAdminAuth = (handler: RouteHandler): RouteHandler => {
  return async (request, context) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        throw new UnauthorizedError();
      }

      if (session.user.role !== "ADMIN") {
        throw new ForbiddenError();
      }

      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
};

export const withPlatformAuth = (handler: AuthenticatedHandler): RouteHandler => {
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
};
