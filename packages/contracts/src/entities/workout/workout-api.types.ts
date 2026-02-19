import { type z } from "zod";

import {
  type createWorkoutParamsSchema,
  type createWorkoutRequestSchema,
  type createWorkoutResponseSchema,
  type deleteWorkoutParamsSchema,
  type getWorkoutByIdParamsSchema,
  type getWorkoutResponseSchema,
  type getWorkoutsParamsSchema,
  type getWorkoutsResponseSchema,
  type updateWorkoutParamsSchema,
  type updateWorkoutRequestSchema,
  type updateWorkoutResponseSchema,
} from "./workout-api.schema";

export type GetWorkoutsParams = z.infer<typeof getWorkoutsParamsSchema>;
export type GetWorkoutsResponse = z.infer<typeof getWorkoutsResponseSchema>;
export type GetWorkoutByIdParams = z.infer<typeof getWorkoutByIdParamsSchema>;
export type GetWorkoutResponse = z.infer<typeof getWorkoutResponseSchema>;
export type CreateWorkoutParams = z.infer<typeof createWorkoutParamsSchema>;
export type CreateWorkoutRequest = z.infer<typeof createWorkoutRequestSchema>;
export type CreateWorkoutResponse = z.infer<typeof createWorkoutResponseSchema>;
export type UpdateWorkoutParams = z.infer<typeof updateWorkoutParamsSchema>;
export type UpdateWorkoutRequest = z.infer<typeof updateWorkoutRequestSchema>;
export type UpdateWorkoutResponse = z.infer<typeof updateWorkoutResponseSchema>;
export type DeleteWorkoutParams = z.infer<typeof deleteWorkoutParamsSchema>;
