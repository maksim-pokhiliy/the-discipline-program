import { type z } from "zod";

import {
  type exerciseDefaultMetricsSchema,
  type exerciseLibraryItemSchema,
} from "./exercise-library-item.schema";

export type ExerciseLibraryItem = z.infer<typeof exerciseLibraryItemSchema>;
export type ExerciseDefaultMetrics = z.infer<typeof exerciseDefaultMetricsSchema>;
