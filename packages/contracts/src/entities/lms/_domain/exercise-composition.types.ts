import { type z } from "zod";

import { type exerciseCompositionSchema } from "./exercise-composition.schema";

export type ExerciseComposition = z.infer<typeof exerciseCompositionSchema>;
