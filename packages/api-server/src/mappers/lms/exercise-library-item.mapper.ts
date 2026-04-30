import { type ExerciseLibraryItem as PrismaExerciseLibraryItem } from "@prisma/client";

import {
  exerciseDefaultMetricsSchema,
  type ExerciseLibraryItem,
} from "@repo/contracts/lms/exercise-library-item";

import {
  BODY_PART_MAP,
  LIBRARY_SCOPE_MAP,
  MODALITY_MAP,
  MOVEMENT_PATTERN_MAP,
  SKILL_LEVEL_MAP,
} from "./enum-maps";

export const mapToExerciseLibraryItem = (e: PrismaExerciseLibraryItem): ExerciseLibraryItem => ({
  id: e.id,
  scope: LIBRARY_SCOPE_MAP[e.scope],
  ownerId: e.ownerId,
  name: e.name,
  nameAliases: e.nameAliases,
  description: e.description,
  primaryMovement: MOVEMENT_PATTERN_MAP[e.primaryMovement],
  modality: MODALITY_MAP[e.modality],
  equipment: e.equipment,
  primaryBodyParts: e.primaryBodyParts.map((bp) => BODY_PART_MAP[bp]),
  secondaryBodyParts: e.secondaryBodyParts.map((bp) => BODY_PART_MAP[bp]),
  skillLevel: SKILL_LEVEL_MAP[e.skillLevel],
  defaultMetrics: exerciseDefaultMetricsSchema.parse(e.defaultMetrics),
  demoVideoUrl: e.demoVideoUrl,
  demoImageUrl: e.demoImageUrl,
  parentId: e.parentId,
  isBenchmark: e.isBenchmark,
  version: e.version,
  supersedesId: e.supersedesId,
  isDeprecated: e.isDeprecated,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
  deletedAt: e.deletedAt,
});
