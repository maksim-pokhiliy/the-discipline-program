import { z } from "zod";

import { movementPatternSchema } from "../_domain/movement-pattern.schema";

export const tonnageByPatternSchema = z.record(movementPatternSchema, z.number().nonnegative());

export const weeklyVolumeSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  weekStartDate: z.date(),
  totalTonnageKg: z.number().nonnegative(),
  tonnageByPattern: tonnageByPatternSchema,
  totalDurationSec: z.number().int().nonnegative(),
  workoutsScheduled: z.number().int().nonnegative(),
  workoutsFullyCompleted: z.number().int().nonnegative(),
  workoutsPartiallyCompleted: z.number().int().nonnegative(),
  workoutsMissed: z.number().int().nonnegative(),
  workoutsRx: z.number().int().nonnegative(),
  workoutsScaled: z.number().int().nonnegative(),
  recomputedAt: z.date(),
});
