import { type GetMobileAthletesResponse } from "@repo/contracts/coaching/mobile-connection";

import { prisma } from "../../../db/client";
import { LEGACY_PLAN_INDIVIDUAL } from "../../mobile-compat/legacy-catalogs";

export const SYNTHETIC_LEGACY_USER_ID_FLOOR = 990_000;

export type AthletesApi = {
  listIndividualAthletes(userId: string): Promise<GetMobileAthletesResponse>;
};

export const athletesApi: AthletesApi = {
  listIndividualAthletes: async () => {
    const identities = await prisma.mobileLegacyIdentity.findMany({
      where: {
        legacyPlanId: LEGACY_PLAN_INDIVIDUAL,
        legacyUserId: { lt: SYNTHETIC_LEGACY_USER_ID_FLOOR },
        user: { deletedAt: null },
      },
      orderBy: { legacyUserId: "asc" },
      select: {
        legacyUserId: true,
        firstName: true,
        lastName: true,
        user: { select: { email: true } },
      },
    });

    return identities.map((identity) => ({
      id: identity.legacyUserId,
      username: identity.user.email,
      firstName: identity.firstName,
      lastName: identity.lastName,
    }));
  },
};
