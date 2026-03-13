import type { AthleteMax, CreateAthleteMaxData } from "@repo/contracts/athlete-max";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToAthleteMax } from "../../mappers";

import { resolveCoachId, verifyPlanOwnership } from "./guards";

export const platformAthleteMaxesApi = {
  getAll: async (userId: string, exerciseId?: string): Promise<AthleteMax[]> => {
    await resolveCoachId(userId);

    const maxes = await prisma.athleteMax.findMany({
      where: exerciseId ? { exerciseId } : {},
      orderBy: { testedAt: "desc" },
    });

    return maxes.map(mapToAthleteMax);
  },

  getForPlanExercises: async (
    userId: string,
    planId: string,
    exerciseIds: string[],
  ): Promise<AthleteMax[]> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const enrollments = await prisma.planEnrollment.findMany({
      where: { trainingPlanId: planId, status: "ACTIVE" },
      select: { userId: true },
    });

    const athleteUserIds = enrollments.map((e) => e.userId);

    if (athleteUserIds.length === 0 || exerciseIds.length === 0) {
      return [];
    }

    const maxes = await prisma.$queryRaw<
      Array<{
        id: string;
        userId: string;
        exerciseId: string;
        value: unknown;
        unit: string;
        testedAt: Date;
        createdAt: Date;
      }>
    >`
      SELECT DISTINCT ON ("userId", "exerciseId")
        "id", "userId", "exerciseId", "value", "unit", "testedAt", "createdAt"
      FROM "app_athlete_maxes"
      WHERE "userId" = ANY(${athleteUserIds})
        AND "exerciseId" = ANY(${exerciseIds})
      ORDER BY "userId", "exerciseId", "testedAt" DESC
    `;

    return maxes.map((m) => ({
      id: m.id,
      userId: m.userId,
      exerciseId: m.exerciseId,
      value: Number(m.value),
      unit: m.unit as AthleteMax["unit"],
      testedAt: m.testedAt,
      createdAt: m.createdAt,
    }));
  },

  create: async (userId: string, data: CreateAthleteMaxData): Promise<AthleteMax> => {
    await resolveCoachId(userId);

    const max = await prisma.athleteMax.create({ data });

    return mapToAthleteMax(max);
  },

  delete: async (userId: string, id: string): Promise<void> => {
    await resolveCoachId(userId);

    const existing = await prisma.athleteMax.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError("Athlete max not found", { id });
    }

    await prisma.athleteMax.delete({ where: { id } });
  },
};
