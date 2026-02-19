import { type z } from "zod";

import {
  type createSetLogSchema,
  type createWorkoutLogSchema,
  type setLogSchema,
  type workoutLogSchema,
} from "./workout-log.schema";

export type SetLog = z.infer<typeof setLogSchema>;
export type WorkoutLog = z.infer<typeof workoutLogSchema>;
export type CreateSetLogData = z.infer<typeof createSetLogSchema>;
export type CreateWorkoutLogData = z.infer<typeof createWorkoutLogSchema>;
