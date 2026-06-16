import { type Exercise } from "@repo/contracts/lms/exercise";

import { requireCoachLikeRole } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToExercise } from "../../../mappers/lms";

export const lmsExercisePlatformApi = {
  list: async (userId: string): Promise<Exercise[]> => {
    await requireCoachLikeRole(userId);

    const rows = await prisma.exercise.findMany({
      orderBy: [{ movementFamily: "asc" }, { canonicalName: "asc" }],
    });

    return rows.map(mapToExercise);
  },
};
