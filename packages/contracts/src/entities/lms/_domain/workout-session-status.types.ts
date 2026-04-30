import { type z } from "zod";

import { type workoutSessionStatusSchema } from "./workout-session-status.schema";

export type WorkoutSessionStatus = z.infer<typeof workoutSessionStatusSchema>;

export const WORKOUT_SESSION_STATUSES: readonly WorkoutSessionStatus[] = [
  "IN_PROGRESS",
  "COMPLETED",
  "ABANDONED",
  "SKIPPED",
] as const;
