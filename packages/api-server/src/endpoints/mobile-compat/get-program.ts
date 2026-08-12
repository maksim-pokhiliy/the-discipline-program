import type { LegacyProgramOutcome, LegacyShimIdentity } from "@repo/api-routes/legacy-shim";
import { logger } from "@repo/shared";

import { prisma } from "../../db/client";

import { LEGACY_PLAN_INDIVIDUAL } from "./legacy-catalogs";
import { assembleGeneralProgramDto, assembleIndividualProgramDto } from "./program-dto";
import { type LegacyProgramDto } from "./wire-schemas";

export type GetProgramApi = {
  getProgram: (
    identity: LegacyShimIdentity,
    userId: number,
    scheduledDate: string,
  ) => Promise<LegacyProgramOutcome<LegacyProgramDto>>;
};

export const createGetProgramApi = (): GetProgramApi => ({
  getProgram: async (identity, userId, scheduledDate) => {
    if (userId !== identity.legacyUserId) {
      logger.warn("mobile_shim.get_program.scope_mismatch", {
        legacyUserId: identity.legacyUserId,
        requestedUserId: userId,
      });

      return { kind: "not-found" };
    }

    const isIndividual = identity.legacyPlanId === LEGACY_PLAN_INDIVIDUAL;
    const scheduledDateValue = new Date(`${scheduledDate}T00:00:00.000Z`);

    const row = await prisma.mobilePublishedDay.findFirst({
      where: {
        scheduledDate: scheduledDateValue,
        isRestDay: { not: null },
        link: isIndividual
          ? { channel: "INDIVIDUAL", legacyUserId: identity.legacyUserId }
          : { channel: "GENERAL", legacyLevelId: identity.legacyLevelId },
      },
      orderBy: [{ publishedAt: "desc" }, { legacyRowId: "desc" }],
      select: {
        legacyRowId: true,
        scheduledDate: true,
        isRestDay: true,
        dailyProgram: true,
      },
    });

    if (!row) {
      return { kind: "not-found" };
    }

    const payload = isIndividual
      ? assembleIndividualProgramDto(row, identity.legacyUserId)
      : assembleGeneralProgramDto(row, identity.legacyLevelId);

    return { kind: "ok-json", payload };
  },
});
