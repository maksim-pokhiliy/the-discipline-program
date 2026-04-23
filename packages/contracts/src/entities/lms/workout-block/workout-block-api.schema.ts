import { z } from "zod";

import { workoutBlockSchema } from "./workout-block.schema";

export const getWorkoutBlocksResponseSchema = z.array(workoutBlockSchema);

export const getWorkoutBlockResponseSchema = workoutBlockSchema;
