import { z } from "zod";

import { EXERCISE_CONSTANTS, ExerciseStatus, MeasurementUnit } from "./exercise.constants";

export const exerciseStatusSchema = z.nativeEnum(ExerciseStatus);

export const measurementUnitSchema = z.nativeEnum(MeasurementUnit);

export const exerciseSchema = z.object({
  id: z.string().cuid(),
  canonicalName: z.string().min(1).max(EXERCISE_CONSTANTS.MAX_NAME_LENGTH),
  normalizedName: z.string().min(1).max(EXERCISE_CONSTANTS.MAX_NAME_LENGTH),
  aliases: z
    .array(z.string().max(EXERCISE_CONSTANTS.MAX_ALIAS_LENGTH))
    .max(EXERCISE_CONSTANTS.MAX_ALIASES),
  description: z.string().max(EXERCISE_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullable(),
  videoUrl: z.string().url().nullable(),
  measurementUnits: z.array(measurementUnitSchema).min(1),
  hasLoad: z.boolean(),
  status: exerciseStatusSchema,
  mergedIntoId: z.string().cuid().nullable(),
  createdByUserId: z.string().cuid(),
  reviewedByUserId: z.string().cuid().nullable(),
  reviewedAt: z.date().nullable(),
  reviewNotes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const exerciseListItemSchema = exerciseSchema.extend({
  usageCount: z.number().int().nonnegative(),
});

export const createExerciseSchema = z.object({
  canonicalName: z.string().min(1).max(EXERCISE_CONSTANTS.MAX_NAME_LENGTH),
  aliases: z
    .array(z.string().min(1).max(EXERCISE_CONSTANTS.MAX_ALIAS_LENGTH))
    .max(EXERCISE_CONSTANTS.MAX_ALIASES)
    .default([]),
  description: z.string().max(EXERCISE_CONSTANTS.MAX_DESCRIPTION_LENGTH).optional(),
  videoUrl: z.string().url().optional(),
  measurementUnits: z.array(measurementUnitSchema).min(1).default([MeasurementUnit.REPS]),
  hasLoad: z.boolean().default(false),
});

export const updateExerciseSchema = createExerciseSchema.partial();

export const mergeExerciseSchema = z.object({
  targetExerciseId: z.string().cuid(),
});

export const rejectExerciseSchema = z.object({
  reviewNotes: z.string().max(EXERCISE_CONSTANTS.MAX_REVIEW_NOTES_LENGTH).optional(),
});
