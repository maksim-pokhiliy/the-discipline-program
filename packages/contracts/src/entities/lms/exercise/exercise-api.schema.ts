import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createExerciseSchema, exerciseSchema, updateExerciseSchema } from "./exercise.schema";

export const getExercisesResponseSchema = z.array(exerciseSchema);

export const getExerciseByIdParamsSchema = idParamSchema;

export const getExerciseResponseSchema = exerciseSchema;

export const createExerciseRequestSchema = createExerciseSchema;

export const createExerciseResponseSchema = exerciseSchema;

export const updateExerciseParamsSchema = idParamSchema;

export const updateExerciseRequestSchema = updateExerciseSchema;

export const updateExerciseResponseSchema = exerciseSchema;

export const deleteExerciseParamsSchema = idParamSchema;

export const getExercisesPageDataResponseSchema = z.object({
  exercises: getExercisesResponseSchema,
});
