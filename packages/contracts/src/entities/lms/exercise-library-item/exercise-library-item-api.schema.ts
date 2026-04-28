import { z } from "zod";

import { bodyPartSchema } from "../_domain/body-part.schema";
import { libraryScopeSchema } from "../_domain/library-scope.schema";
import { modalitySchema } from "../_domain/modality.schema";
import { movementPatternSchema } from "../_domain/movement-pattern.schema";
import { skillLevelSchema } from "../_domain/skill-level.schema";

import { EXERCISE_LIBRARY_ITEM_CONSTANTS } from "./exercise-library-item.constants";
import {
  exerciseDefaultMetricsSchema,
  exerciseLibraryItemSchema,
} from "./exercise-library-item.schema";

export const createExerciseLibraryItemInputSchema = z.object({
  scope: libraryScopeSchema.default("COACH"),
  name: z.string().min(1).max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_NAME_LENGTH),
  nameAliases: z
    .array(z.string().min(1).max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_ALIAS_LENGTH))
    .max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_ALIASES)
    .default([]),
  description: z.string().max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_DESCRIPTION_LENGTH).optional(),
  primaryMovement: movementPatternSchema,
  modality: modalitySchema,
  equipment: z
    .array(z.string().min(1).max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_EQUIPMENT_TAG_LENGTH))
    .max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_EQUIPMENT_TAGS)
    .default([]),
  primaryBodyParts: z
    .array(bodyPartSchema)
    .max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_BODY_PARTS)
    .default([]),
  secondaryBodyParts: z
    .array(bodyPartSchema)
    .max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_BODY_PARTS)
    .default([]),
  skillLevel: skillLevelSchema.default("BEGINNER"),
  defaultMetrics: exerciseDefaultMetricsSchema,
  demoVideoUrl: z.string().url().optional(),
  demoImageUrl: z.string().url().optional(),
  parentId: z.string().cuid().optional(),
  isBenchmark: z.boolean().default(false),
});

export const updateExerciseLibraryItemInputSchema = createExerciseLibraryItemInputSchema
  .partial()
  .extend({
    ownerId: z.string().cuid().nullable().optional(),
    isDeprecated: z.boolean().optional(),
    supersedesId: z.string().cuid().nullable().optional(),
  });

export const exerciseLibraryItemIdParamSchema = z.object({
  exerciseLibraryItemId: z.string().cuid(),
});

export const listExerciseLibraryItemsQuerySchema = z.object({
  scope: libraryScopeSchema.optional(),
  ownerId: z.string().cuid().optional(),
  primaryMovement: movementPatternSchema.optional(),
  modality: modalitySchema.optional(),
  isBenchmark: z.boolean().optional(),
  search: z.string().min(1).max(100).optional(),
  includeDeleted: z.boolean().optional(),
  take: z.coerce.number().int().min(1).max(500).optional(),
});

export const listExerciseLibraryItemsResponseSchema = z.object({
  items: z.array(exerciseLibraryItemSchema),
  total: z.number().int().nonnegative(),
});

export const getExerciseLibraryItemResponseSchema = exerciseLibraryItemSchema;
export const createExerciseLibraryItemResponseSchema = exerciseLibraryItemSchema;
export const updateExerciseLibraryItemResponseSchema = exerciseLibraryItemSchema;

export const promoteExerciseLibraryItemResponseSchema = exerciseLibraryItemSchema;
export const demoteExerciseLibraryItemInputSchema = z.object({
  newOwnerId: z.string().cuid(),
});
export const demoteExerciseLibraryItemResponseSchema = exerciseLibraryItemSchema;
