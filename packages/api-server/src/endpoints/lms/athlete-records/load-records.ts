import { type OneRMRecordSource, type Prisma } from "@prisma/client";

import { profileSelectionsSchema } from "@repo/contracts/coaching/athlete-profile";

import { prisma } from "../../../db/client";
import { ONE_RM_RECORD_SOURCE_MAP } from "../../../mappers/lms";

import { type AthleteLoadContext, type AthleteOneRMBase } from "./athlete-records.types";

const buildCurrentOneRMMap = (
  rows: {
    exerciseId: string;
    valueKg: Prisma.Decimal;
    recordedAt: Date;
    source: OneRMRecordSource;
  }[],
): Map<string, AthleteOneRMBase> => {
  const byExercise = new Map<string, AthleteOneRMBase>();

  for (const row of rows) {
    if (!byExercise.has(row.exerciseId)) {
      byExercise.set(row.exerciseId, {
        valueKg: Number(row.valueKg),
        recordedAt: row.recordedAt,
        source: ONE_RM_RECORD_SOURCE_MAP[row.source],
      });
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
          select: { exerciseId: true, valueKg: true, recordedAt: true, source: true },
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
