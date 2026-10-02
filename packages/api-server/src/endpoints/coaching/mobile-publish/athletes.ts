import { type GetLinkableAthletesResponse } from "@repo/contracts/coaching/mobile-link";

import { verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { LEGACY_PLAN_INDIVIDUAL } from "../../mobile-compat/legacy-catalogs";

import { enrolledInPlanWhere } from "./enrolled-athlete-where";

export type AthletesApi = {
  listLinkableAthletes(userId: string, planId: string): Promise<GetLinkableAthletesResponse>;
};

export const athletesApi: AthletesApi = {
  listLinkableAthletes: async (userId, planId) => {
    await verifyPlanOwnership(planId, userId);

    const athletes = await prisma.user.findMany({
      where: {
        ...enrolledInPlanWhere(planId),
        legacyIdentity: { is: { legacyPlanId: LEGACY_PLAN_INDIVIDUAL } },
      },
      orderBy: { id: "asc" },
      select: { id: true },
    });

    return athletes.map((athlete) => ({ athleteId: athlete.id }));
  },
};
