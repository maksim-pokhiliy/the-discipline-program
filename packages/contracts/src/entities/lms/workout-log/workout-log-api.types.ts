import { type z } from "zod";

import {
  type createWorkoutLogRequestSchema,
  type createWorkoutLogResponseSchema,
  type deleteWorkoutLogParamsSchema,
  type getWorkoutLogByIdParamsSchema,
  type getWorkoutLogResponseSchema,
  type getWorkoutLogsResponseSchema,
} from "./workout-log-api.schema";

export type GetWorkoutLogsResponse = z.infer<typeof getWorkoutLogsResponseSchema>;
export type GetWorkoutLogByIdParams = z.infer<typeof getWorkoutLogByIdParamsSchema>;
export type GetWorkoutLogResponse = z.infer<typeof getWorkoutLogResponseSchema>;
export type CreateWorkoutLogRequest = z.infer<typeof createWorkoutLogRequestSchema>;
export type CreateWorkoutLogResponse = z.infer<typeof createWorkoutLogResponseSchema>;
export type DeleteWorkoutLogParams = z.infer<typeof deleteWorkoutLogParamsSchema>;
