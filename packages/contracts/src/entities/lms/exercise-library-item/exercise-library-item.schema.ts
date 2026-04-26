import { z } from "zod";

import { bodyPartSchema } from "../_domain/body-part.schema";
import { libraryScopeSchema } from "../_domain/library-scope.schema";
import { modalitySchema } from "../_domain/modality.schema";
import { movementPatternSchema } from "../_domain/movement-pattern.schema";
import { skillLevelSchema } from "../_domain/skill-level.schema";

import { EXERCISE_LIBRARY_ITEM_CONSTANTS } from "./exercise-library-item.constants";

export const exerciseDefaultMetricsSchema = z.object({
  canMeasureLoad: z.boolean(),
  canMeasureReps: z.boolean(),
  canMeasureDuration: z.boolean(),
  canMeasureDistance: z.boolean(),
  canMeasureCalories: z.boolean(),
});

export const exerciseLibraryItemSchema = z.object({
  id: z.string().cuid(),
  scope: libraryScopeSchema,
  ownerId: z.string().cuid().nullable(),
  name: z.string().min(1).max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_NAME_LENGTH),
  nameAliases: z
    .array(z.string().min(1).max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_ALIAS_LENGTH))
    .max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_ALIASES),
  description: z.string().max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullable(),
  primaryMovement: movementPatternSchema,
  modality: modalitySchema,
  equipment: z
    .array(z.string().min(1).max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_EQUIPMENT_TAG_LENGTH))
    .max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_EQUIPMENT_TAGS),
  primaryBodyParts: z.array(bodyPartSchema).max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_BODY_PARTS),
  secondaryBodyParts: z.array(bodyPartSchema).max(EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_BODY_PARTS),
  skillLevel: skillLevelSchema,
  defaultMetrics: exerciseDefaultMetricsSchema,
  demoVideoUrl: z.string().url().nullable(),
  demoImageUrl: z.string().url().nullable(),
  parentId: z.string().cuid().nullable(),
  isBenchmark: z.boolean(),
  version: z.number().int().nonnegative(),
  supersedesId: z.string().cuid().nullable(),
  isDeprecated: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});
