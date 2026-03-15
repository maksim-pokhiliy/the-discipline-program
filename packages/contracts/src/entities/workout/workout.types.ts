import { type z } from "zod";

import {
  type createWorkoutSchema,
  type updateWorkoutSchema,
  type workoutSchema,
} from "./workout.schema";

export type Workout = z.infer<typeof workoutSchema>;
export type CreateWorkoutData = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutData = z.infer<typeof updateWorkoutSchema>;
