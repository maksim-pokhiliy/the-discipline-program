import { type z } from "zod";

import {
  type createWorkoutSchema,
  type updateWorkoutSchema,
  type workoutSchema,
  type workoutWithBlocksSchema,
} from "./workout.schema";

export type Workout = z.infer<typeof workoutSchema>;
export type WorkoutWithBlocks = z.infer<typeof workoutWithBlocksSchema>;
export type CreateWorkoutData = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutData = z.infer<typeof updateWorkoutSchema>;
