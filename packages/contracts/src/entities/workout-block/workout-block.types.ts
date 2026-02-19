import { type z } from "zod";

import {
  type createWorkoutBlockSchema,
  type updateWorkoutBlockSchema,
  type workoutBlockSchema,
} from "./workout-block.schema";

export type WorkoutBlock = z.infer<typeof workoutBlockSchema>;
export type CreateWorkoutBlockData = z.infer<typeof createWorkoutBlockSchema>;
export type UpdateWorkoutBlockData = z.infer<typeof updateWorkoutBlockSchema>;
