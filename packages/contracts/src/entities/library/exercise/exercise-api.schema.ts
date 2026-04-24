import { z } from "zod";

import { exerciseIdParamSchema } from "../../../common";

import { ExerciseStatus } from "./exercise.constants";
import {
  createExerciseSchema,
  exerciseListItemSchema,
  exerciseSchema,
  mergeExerciseSchema,
  rejectExerciseSchema,
  updateExerciseSchema,
} from "./exercise.schema";

export const getExercisesQuerySchema = z.object({
  search: z.string().max(200).optional(),
  status: z.nativeEnum(ExerciseStatus).optional(),
  includeOwnDrafts: z.coerce.boolean().optional(),
  createdByUserId: z.string().cuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

export const getExercisesResponseSchema = z.object({
  items: z.array(exerciseListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export const getMyExercisesResponseSchema = getExercisesResponseSchema;

export const getExerciseByIdParamsSchema = exerciseIdParamSchema;

export const getExerciseResponseSchema = exerciseSchema;

export const createExerciseRequestSchema = createExerciseSchema;

export const createExerciseResponseSchema = exerciseSchema;

export const updateExerciseParamsSchema = exerciseIdParamSchema;

export const updateExerciseRequestSchema = updateExerciseSchema;

export const updateExerciseResponseSchema = exerciseSchema;

export const deleteExerciseParamsSchema = exerciseIdParamSchema;

export const approveExerciseParamsSchema = exerciseIdParamSchema;

export const approveExerciseResponseSchema = exerciseSchema;

export const rejectExerciseParamsSchema = exerciseIdParamSchema;

export const rejectExerciseRequestSchema = rejectExerciseSchema;

export const rejectExerciseResponseSchema = exerciseSchema;

export const mergeExerciseParamsSchema = exerciseIdParamSchema;

export const mergeExerciseRequestSchema = mergeExerciseSchema;

export const mergeExerciseResponseSchema = exerciseSchema;
