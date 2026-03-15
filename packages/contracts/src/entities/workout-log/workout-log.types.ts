import { type z } from "zod";

import { type createWorkoutLogSchema, type workoutLogSchema } from "./workout-log.schema";

export type WorkoutLog = z.infer<typeof workoutLogSchema>;
export type CreateWorkoutLogData = z.infer<typeof createWorkoutLogSchema>;
