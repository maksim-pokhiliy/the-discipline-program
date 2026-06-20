import {
  type CreatePerformedSessionData,
  type PerformedSession,
} from "@repo/contracts/lms/performed-session";

import { prisma } from "../../../db/client";
import { mapToPerformedSession } from "../../../mappers/lms";
import { handlePrismaError } from "../../../utils";
import { assertSessionReachableByAthlete } from "../_shared";

export const lmsPerformedSessionApi = {
  create: async (userId: string, data: CreatePerformedSessionData): Promise<PerformedSession> => {
    await assertSessionReachableByAthlete(data.sessionId, userId);

    try {
      const performed = await prisma.$transaction(async (tx) =>
        tx.performedSession.create({
          data: {
            sessionId: data.sessionId,
            userId,
            performedAt: data.performedAt,
            athleteNotes: data.athleteNotes ?? null,
          },
        }),
      );

      return mapToPerformedSession(performed);
    } catch (error) {
      return handlePrismaError(error, { entity: "Performed session" });
    }
  },
};
