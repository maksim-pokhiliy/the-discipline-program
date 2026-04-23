import { type Exercise as PrismaExercise } from "@prisma/client";

import { type Exercise } from "@repo/contracts/library/exercise";

import { EXERCISE_STATUS_MAP, MEASUREMENT_UNIT_MAP } from "./enum-maps";

export const mapToExercise = (row: PrismaExercise): Exercise => ({
  id: row.id,
  canonicalName: row.canonicalName,
  normalizedName: row.normalizedName,
  aliases: row.aliases,
  description: row.description,
  videoUrl: row.videoUrl,
  measurementUnits: row.measurementUnits.map((unit) => MEASUREMENT_UNIT_MAP[unit]),
  hasLoad: row.hasLoad,
  status: EXERCISE_STATUS_MAP[row.status],
  mergedIntoId: row.mergedIntoId,
  createdByUserId: row.createdByUserId,
  reviewedByUserId: row.reviewedByUserId,
  reviewedAt: row.reviewedAt,
  reviewNotes: row.reviewNotes,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
