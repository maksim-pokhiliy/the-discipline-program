import { Prisma } from "@prisma/client";

import {
  type CreateExerciseData,
  type Exercise,
  type GetAthleteMovementsResponse,
} from "@repo/contracts/lms/exercise";

import { requireCoachLikeRole } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToExercise, natureToPrisma } from "../../../mappers/lms";
import { handlePrismaError } from "../../../utils";

export const lmsExercisePlatformApi = {
  list: async (userId: string): Promise<Exercise[]> => {
    await requireCoachLikeRole(userId);

    const rows = await prisma.exercise.findMany({
      orderBy: { canonicalName: "asc" },
    });

    return rows.map(mapToExercise);
  },

  create: async (userId: string, data: CreateExerciseData): Promise<Exercise> => {
    await requireCoachLikeRole(userId);

    const canonicalNameLower = data.canonicalName.trim().toLowerCase();

    try {
      const created = await prisma.exercise.create({
        data: {
          canonicalName: data.canonicalName,
          canonicalNameLower,
          nature: natureToPrisma[data.nature],
          defaultDemoUrls: data.defaultDemoUrls,
          aliases: data.aliases,
          notes: data.notes ?? null,
        },
      });

      return mapToExercise(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await prisma.exercise.findUnique({ where: { canonicalNameLower } });

        if (existing !== null) {
          return mapToExercise(existing);
        }
      }

      return handlePrismaError(error, { entity: "Exercise" });
    }
  },

  listForAthlete: async (_userId: string): Promise<GetAthleteMovementsResponse> => {
    return prisma.exercise.findMany({
      where: { nature: natureToPrisma.CONCRETE },
      orderBy: { canonicalName: "asc" },
      select: { id: true, canonicalName: true },
    });
  },
};
