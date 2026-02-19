import { z } from "zod";

import { createWorkoutLogSchema, workoutLogSchema } from "./workout-log.schema";

export const getWorkoutLogsResponseSchema = z.array(workoutLogSchema);

export const getWorkoutLogByIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const getWorkoutLogResponseSchema = workoutLogSchema;

export const createWorkoutLogRequestSchema = createWorkoutLogSchema;

export const createWorkoutLogResponseSchema = workoutLogSchema;

export const deleteWorkoutLogParamsSchema = z.object({
  id: z.string().cuid(),
});
