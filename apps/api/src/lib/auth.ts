import { getServerSession } from "next-auth/next";

import { authOptions } from "@repo/auth/config";
import { ForbiddenError, UnauthorizedError } from "@repo/errors";

import { handleApiError } from "./error-handler";

type RouteContext = { params: Promise<Record<string, string>> };
type RouteHandler = (request: Request, context: RouteContext) => Promise<Response>;
type AuthenticatedHandler = (
  request: Request,
  context: RouteContext,
  userId: string,
) => Promise<Response>;

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
