import { type WeeklyVolume as PrismaWeeklyVolume } from "@prisma/client";

import { tonnageByPatternSchema, type WeeklyVolume } from "@repo/contracts/lms/weekly-volume";

export const mapToWeeklyVolume = (w: PrismaWeeklyVolume): WeeklyVolume => ({
  id: w.id,
  userId: w.userId,
  weekStartDate: w.weekStartDate,
  totalTonnageKg: w.totalTonnageKg.toNumber(),
  tonnageByPattern: tonnageByPatternSchema.parse(w.tonnageByPattern),
  totalDurationSec: w.totalDurationSec,
  workoutsScheduled: w.workoutsScheduled,
  workoutsFullyCompleted: w.workoutsFullyCompleted,
  workoutsPartiallyCompleted: w.workoutsPartiallyCompleted,
  workoutsMissed: w.workoutsMissed,
  workoutsRx: w.workoutsRx,
  workoutsScaled: w.workoutsScaled,
  recomputedAt: w.recomputedAt,
});
