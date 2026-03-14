import { type z } from "zod";

import {
  type blockScoreSchema,
  type createBlockScoreSchema,
  type createSetLogSchema,
  type createWorkoutLogSchema,
  type setLogSchema,
  type workoutLogSchema,
} from "./workout-log.schema";

export type SetLog = z.infer<typeof setLogSchema>;
export type BlockScore = z.infer<typeof blockScoreSchema>;
export type WorkoutLog = z.infer<typeof workoutLogSchema>;
export type CreateSetLogData = z.infer<typeof createSetLogSchema>;
export type CreateBlockScoreData = z.infer<typeof createBlockScoreSchema>;
export type CreateWorkoutLogData = z.infer<typeof createWorkoutLogSchema>;
