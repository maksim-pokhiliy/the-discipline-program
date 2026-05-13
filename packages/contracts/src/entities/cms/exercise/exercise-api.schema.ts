import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createExerciseSchema, exerciseSchema, updateExerciseSchema } from "./exercise.schema";

export const getExercisesResponseSchema = z.array(exerciseSchema);

export const getExerciseByIdParamsSchema = idParamSchema;

export const createExerciseRequestSchema = createExerciseSchema;

export const updateExerciseParamsSchema = idParamSchema;

export const updateExerciseRequestSchema = updateExerciseSchema;

export const deleteExerciseParamsSchema = idParamSchema;

export const getExercisesPageDataResponseSchema = z.object({
  exercises: getExercisesResponseSchema,
});

export const getMovementFamiliesResponseSchema = z.array(z.string());
