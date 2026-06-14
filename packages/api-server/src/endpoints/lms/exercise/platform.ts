import { type Exercise } from "@repo/contracts/lms/exercise";

import { requireCoachLikeRole } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToExercise } from "../../../mappers/lms";

import { EXERCISE_WITH_EQUIPMENT_INCLUDE } from "./admin";

export const lmsExercisePlatformApi = {
  list: async (userId: string): Promise<Exercise[]> => {
    await requireCoachLikeRole(userId);

    const rows = await prisma.exercise.findMany({
      orderBy: [{ movementFamily: "asc" }, { canonicalName: "asc" }],
      include: EXERCISE_WITH_EQUIPMENT_INCLUDE,
    });

    return rows.map(mapToExercise);
  },
};
