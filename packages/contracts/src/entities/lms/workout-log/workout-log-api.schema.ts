import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createWorkoutLogSchema, workoutLogSchema } from "./workout-log.schema";

export const getWorkoutLogsResponseSchema = z.array(workoutLogSchema);

export const getWorkoutLogByIdParamsSchema = idParamSchema;

export const getWorkoutLogResponseSchema = workoutLogSchema;

export const createWorkoutLogRequestSchema = createWorkoutLogSchema;

export const createWorkoutLogResponseSchema = workoutLogSchema;

export const deleteWorkoutLogParamsSchema = idParamSchema;
