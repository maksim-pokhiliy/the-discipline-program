import { type z } from "zod";

import {
  type createWorkoutSessionInputSchema,
  type createWorkoutSessionResponseSchema,
  type getWorkoutSessionResponseSchema,
  type listWorkoutSessionsQuerySchema,
  type listWorkoutSessionsResponseSchema,
  type updateWorkoutSessionInputSchema,
  type updateWorkoutSessionResponseSchema,
  type workoutSessionIdParamSchema,
} from "./workout-session-api.schema";

export type CreateWorkoutSessionInput = z.infer<typeof createWorkoutSessionInputSchema>;
export type UpdateWorkoutSessionInput = z.infer<typeof updateWorkoutSessionInputSchema>;
export type WorkoutSessionIdParam = z.infer<typeof workoutSessionIdParamSchema>;
export type ListWorkoutSessionsQuery = z.infer<typeof listWorkoutSessionsQuerySchema>;
export type ListWorkoutSessionsResponse = z.infer<typeof listWorkoutSessionsResponseSchema>;
export type GetWorkoutSessionResponse = z.infer<typeof getWorkoutSessionResponseSchema>;
export type CreateWorkoutSessionResponse = z.infer<typeof createWorkoutSessionResponseSchema>;
export type UpdateWorkoutSessionResponse = z.infer<typeof updateWorkoutSessionResponseSchema>;
