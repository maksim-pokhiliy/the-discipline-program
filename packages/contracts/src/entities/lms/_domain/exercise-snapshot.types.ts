import { type z } from "zod";

import { type exerciseSnapshotSchema } from "./exercise-snapshot.schema";

export type ExerciseSnapshot = z.infer<typeof exerciseSnapshotSchema>;
