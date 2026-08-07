import type { LegacyShimResolution } from "@repo/api-routes/legacy-shim";

import { prisma } from "../../db/client";

import { verifyMobileShimToken } from "./shim-token";

const DENIED = { kind: "denied" } as const;

export const resolveMobileShimIdentity = async (token: string): Promise<LegacyShimResolution> => {
  const claims = await verifyMobileShimToken(token);

  if (!claims) {
    return DENIED;
  }

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: {
      id: true,
      tokenVersion: true,
      legacyIdentity: {
        select: {
          legacyUserId: true,
          legacyRoleId: true,
          legacyPlanId: true,
          legacyLevelId: true,
          isEnabled: true,
        },
      },
    },
  });

  const identity = user?.legacyIdentity;

  if (!user || !identity || !identity.isEnabled) {
    return DENIED;
  }

  if (user.tokenVersion !== claims.tokenVersion) {
    return DENIED;
  }

  if (identity.legacyUserId !== claims.legacyUserId) {
    return DENIED;
  }

  return {
    kind: "authenticated",
    identity: {
      userId: user.id,
      legacyUserId: identity.legacyUserId,
      legacyRoleId: identity.legacyRoleId,
      legacyPlanId: identity.legacyPlanId,
      legacyLevelId: identity.legacyLevelId,
    },
  };
};
