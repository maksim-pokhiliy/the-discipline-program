import { z } from "zod";

import { movementPatternSchema } from "../_domain/movement-pattern.schema";
import { prKindSchema } from "../_domain/pr-kind.schema";

import { EXERCISE_CONSTANTS } from "./exercise.constants";

export const exerciseSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(EXERCISE_CONSTANTS.MAX_NAME_LENGTH),
  urls: z.array(z.string().url()).max(EXERCISE_CONSTANTS.MAX_URLS),
  primaryMovement: movementPatternSchema,
  benchmarkPrKind: prKindSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createExerciseSchema = z.object({
  name: z.string().min(1).max(EXERCISE_CONSTANTS.MAX_NAME_LENGTH),
  urls: z.array(z.string().url()).max(EXERCISE_CONSTANTS.MAX_URLS).default([]),
  primaryMovement: movementPatternSchema,
  benchmarkPrKind: prKindSchema.optional(),
});

export const updateExerciseSchema = createExerciseSchema.partial();
