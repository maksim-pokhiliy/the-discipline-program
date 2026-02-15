import {
  type Exercise as PrismaExercise,
  type ExerciseCategory as PrismaExerciseCategory,
} from "@prisma/client";

import { type Exercise } from "@repo/contracts/exercise";

import { mapToExerciseCategory } from "./exercise-category.mapper";

type ExerciseWithCategory = PrismaExercise & { category: PrismaExerciseCategory | null };

export const mapToExercise = (e: ExerciseWithCategory): Exercise => ({
  id: e.id,
  name: e.name,
  description: e.description,
  videoUrl: e.videoUrl,
  categoryId: e.categoryId,
  category: e.category ? mapToExerciseCategory(e.category) : null,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
});
