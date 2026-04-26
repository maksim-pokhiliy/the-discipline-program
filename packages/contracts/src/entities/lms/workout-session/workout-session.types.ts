import { type z } from "zod";

import { type workoutSessionSchema } from "./workout-session.schema";

export type WorkoutSession = z.infer<typeof workoutSessionSchema>;
