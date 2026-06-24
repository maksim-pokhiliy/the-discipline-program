import { type Prisma } from "@prisma/client";

import { profileSelectionsSchema } from "@repo/contracts/coaching/athlete-profile";

import { prisma } from "../../../db/client";

import { type AthleteLoadContext } from "./athlete-records.types";

const buildCurrentOneRMMap = (
  rows: { exerciseId: string; valueKg: Prisma.Decimal }[],
): Map<string, number> => {
  const byExercise = new Map<string, number>();

  for (const row of rows) {
    if (!byExercise.has(row.exerciseId)) {
      byExercise.set(row.exerciseId, Number(row.valueKg));
    }
  }

  return byExercise;
};

export const loadAthleteLoadContext = async (
  userId: string,
  exerciseIds: string[],
): Promise<AthleteLoadContext> => {
  const [profile, oneRMRows] = await Promise.all([
    prisma.athleteProfile.findUnique({
      where: { userId },
      select: { weightKg: true, profileSelections: true, gender: true },
    }),
    exerciseIds.length === 0
      ? Promise.resolve([])
      : prisma.oneRMRecord.findMany({
          where: { userId, exerciseId: { in: exerciseIds } },
          orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
          select: { exerciseId: true, valueKg: true },
        }),
  ]);

  return {
    bodyweightKg: profile?.weightKg ? Number(profile.weightKg) : null,
    currentOneRMByExercise: buildCurrentOneRMMap(oneRMRows),
    profileSelections:
      profile?.profileSelections == null
        ? {}
        : profileSelectionsSchema.parse(profile.profileSelections),
    gender: profile?.gender ?? null,
  };
};
