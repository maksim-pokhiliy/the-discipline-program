import "@repo/auth/types";

import { type NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";

import { UserRole } from "@repo/contracts/iam/auth";
import { ForbiddenError, UnauthorizedError } from "@repo/errors";

import { getMonitoring } from "./monitoring";
import { updateContext } from "./request-context";
import { withErrorHandling } from "./route-helpers";
import type { AuthenticatedHandler, RouteHandler } from "./types";

const ANY_ROLE = "any" as const;

type AllowedRoles = readonly UserRole[] | typeof ANY_ROLE;

const isRoleAllowed = (role: UserRole | null | undefined, allowed: AllowedRoles): boolean => {
  if (allowed === ANY_ROLE) {
    return true;
  }

  return role !== null && role !== undefined && allowed.includes(role);
};

const bindIdentity = (userId: string, role?: string): void => {
  updateContext({ userId, role });
  getMonitoring()?.setUser({ id: userId, role });
};

const releaseIdentity = (): void => {
  getMonitoring()?.setUser(null);
};

const buildWrapper =
  (authOptions: NextAuthOptions, allowed: AllowedRoles) =>
  (handler: AuthenticatedHandler): RouteHandler =>
    withErrorHandling(async (request, context) => {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        throw new UnauthorizedError();
      }

      const role = (session.user.role ?? null) as UserRole | null;

      if (!isRoleAllowed(role, allowed)) {
        throw new ForbiddenError();
      }

      bindIdentity(session.user.id, role ?? undefined);

      try {
        return await handler(request, context, session.user.id);
      } finally {
        releaseIdentity();
      }
    });

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.HEAD_COACH] as const;
const COACH_ROLES = [UserRole.COACH, UserRole.HEAD_COACH, UserRole.ADMIN] as const;
const ATHLETE_ROLES = [UserRole.ATHLETE, UserRole.COACH, UserRole.HEAD_COACH] as const;

export const createAuthWrappers = (authOptions: NextAuthOptions) => ({
  withAdminAuth: buildWrapper(authOptions, ADMIN_ROLES),
  withCoachAuth: buildWrapper(authOptions, COACH_ROLES),
  withAthleteAuth: buildWrapper(authOptions, ATHLETE_ROLES),
  withAuthenticated: buildWrapper(authOptions, ANY_ROLE),
});
