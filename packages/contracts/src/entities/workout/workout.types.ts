import { type z } from "zod";

import {
  type createWorkoutSchema,
  type updateWorkoutSchema,
  type workoutPreviewBlockSchema,
  type workoutPreviewExerciseSchema,
  type workoutPreviewSchema,
  type workoutSchema,
} from "./workout.schema";

export type Workout = z.infer<typeof workoutSchema>;
export type CreateWorkoutData = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutData = z.infer<typeof updateWorkoutSchema>;
export type WorkoutPreview = z.infer<typeof workoutPreviewSchema>;
export type WorkoutPreviewBlock = z.infer<typeof workoutPreviewBlockSchema>;
export type WorkoutPreviewExercise = z.infer<typeof workoutPreviewExerciseSchema>;
