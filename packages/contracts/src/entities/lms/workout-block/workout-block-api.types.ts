import { type z } from "zod";

import {
  type getWorkoutBlockResponseSchema,
  type getWorkoutBlocksResponseSchema,
} from "./workout-block-api.schema";

export type GetWorkoutBlocksResponse = z.infer<typeof getWorkoutBlocksResponseSchema>;
export type GetWorkoutBlockResponse = z.infer<typeof getWorkoutBlockResponseSchema>;
