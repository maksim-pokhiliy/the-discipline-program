import { type z } from "zod";

import { type exerciseLogSchema } from "./exercise-log.schema";

export type ExerciseLog = z.infer<typeof exerciseLogSchema>;
