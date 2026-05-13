import { z } from "zod";

import {
  EXERCISE_CANONICAL_COMPOUND_TYPE,
  EXERCISE_CONSTANTS,
  EXERCISE_EQUIPMENT,
  EXERCISE_MOVEMENT_TYPE,
} from "./exercise.constants";

export const exerciseEquipmentSchema = z.enum(EXERCISE_EQUIPMENT);
export const exerciseMovementTypeSchema = z.enum(EXERCISE_MOVEMENT_TYPE);
export const exerciseCanonicalCompoundTypeSchema = z.enum(EXERCISE_CANONICAL_COMPOUND_TYPE);

export const exerciseSchema = z.object({
  id: z.string().cuid(),
  canonicalName: z.string().min(1).max(EXERCISE_CONSTANTS.MAX_CANONICAL_NAME_LENGTH),
  canonicalNameLower: z.string(),
  primaryEquipment: exerciseEquipmentSchema,
  movementTypeTagPrimary: exerciseMovementTypeSchema,
  movementTypeTagSecondary: exerciseMovementTypeSchema.nullable(),
  canonicalCompoundType: exerciseCanonicalCompoundTypeSchema,
  placeholderFlag: z.boolean(),
  movementFamily: z.string().min(1).max(EXERCISE_CONSTANTS.MAX_MOVEMENT_FAMILY_LENGTH).nullable(),
  defaultDemoUrls: z.array(z.string().url()),
  aliases: z.array(z.string().min(1)),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createExerciseSchema = z.object({
  canonicalName: z.string().min(1).max(EXERCISE_CONSTANTS.MAX_CANONICAL_NAME_LENGTH),
  primaryEquipment: exerciseEquipmentSchema,
  movementTypeTagPrimary: exerciseMovementTypeSchema,
  movementTypeTagSecondary: exerciseMovementTypeSchema.nullable().optional(),
  canonicalCompoundType: exerciseCanonicalCompoundTypeSchema.default("ATOMIC"),
  placeholderFlag: z.boolean().default(false),
  movementFamily: z
    .string()
    .min(1)
    .max(EXERCISE_CONSTANTS.MAX_MOVEMENT_FAMILY_LENGTH)
    .nullable()
    .optional(),
  defaultDemoUrls: z.array(z.string().url()).default([]),
  aliases: z.array(z.string().min(1)).default([]),
  notes: z.string().nullable().optional(),
});

export const updateExerciseSchema = createExerciseSchema.partial();
