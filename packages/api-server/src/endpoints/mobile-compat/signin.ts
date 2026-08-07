import type { LegacyShimOutcome } from "@repo/api-routes/legacy-shim";
import { InternalServerError } from "@repo/errors";
import { logger } from "@repo/shared";

import { prisma } from "../../db/client";
import { iamAuthService } from "../iam/auth-service";

import { findLegacyCatalogEntry, LEGACY_USER_PLANS, LEGACY_USER_ROLES } from "./legacy-catalogs";
import { signMobileShimToken } from "./shim-token";
import type { LegacyJwtDto, LegacySigninRequest } from "./wire-schemas";

export type SigninApi = {
  signin: (input: LegacySigninRequest) => Promise<LegacyShimOutcome<LegacyJwtDto>>;
};

const DENIED = { kind: "denied" } as const;

export const createSigninApi = (): SigninApi => ({
  signin: async (input) => {
    const validated = await iamAuthService.validateUser(input.username, input.password);

    if (!validated) {
      return DENIED;
    }

    const user = await prisma.user.findUnique({
      where: { id: validated.id },
      select: {
        tokenVersion: true,
        legacyIdentity: {
          select: {
            legacyUserId: true,
            legacyRoleId: true,
            legacyPlanId: true,
            isEnabled: true,
          },
        },
      },
    });

    const identity = user?.legacyIdentity;

    if (!identity) {
      logger.warn("mobile_shim.signin.identity_missing", { userId: validated.id });

      return DENIED;
    }

    if (!identity.isEnabled) {
      return DENIED;
    }

    const userRole = findLegacyCatalogEntry(LEGACY_USER_ROLES, identity.legacyRoleId);
    const userPlan = findLegacyCatalogEntry(LEGACY_USER_PLANS, identity.legacyPlanId);

    if (!userRole || !userPlan) {
      throw new InternalServerError("Legacy catalog id is not mapped", {
        legacyRoleId: identity.legacyRoleId,
        legacyPlanId: identity.legacyPlanId,
      });
    }

    const accessToken = await signMobileShimToken({
      sub: validated.id,
      legacyUserId: identity.legacyUserId,
      tokenVersion: user.tokenVersion,
    });

    return {
      kind: "ok",
      payload: {
        userId: identity.legacyUserId,
        accessToken,
        userRole,
        userPlan,
      },
    };
  },
});
