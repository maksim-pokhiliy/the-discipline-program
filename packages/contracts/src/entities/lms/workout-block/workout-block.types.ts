import { type z } from "zod";

import {
  type emomSlotSchema,
  type prescriptionSchema,
  type schemeConfigSchema,
  type workoutBlockExerciseSchema,
  type workoutBlockSchema,
} from "./workout-block.schema";

export type WorkoutBlock = z.infer<typeof workoutBlockSchema>;
export type WorkoutBlockExercise = z.infer<typeof workoutBlockExerciseSchema>;
export type EmomSlot = z.infer<typeof emomSlotSchema>;
export type Prescription = z.infer<typeof prescriptionSchema>;
export type SchemeConfig = z.infer<typeof schemeConfigSchema>;
