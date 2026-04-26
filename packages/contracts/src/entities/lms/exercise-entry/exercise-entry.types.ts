import { type z } from "zod";

import {
  type exerciseEntryAlternativeSchema,
  type exerciseEntrySchema,
} from "./exercise-entry.schema";

export type ExerciseEntry = z.infer<typeof exerciseEntrySchema>;
export type ExerciseEntryAlternative = z.infer<typeof exerciseEntryAlternativeSchema>;
