import { type ExerciseCategory as PrismaExerciseCategory } from "@prisma/client";

import { type ExerciseCategory } from "@repo/contracts/exercise-category";

export const mapToExerciseCategory = (c: PrismaExerciseCategory): ExerciseCategory => ({
  id: c.id,
  name: c.name,
  sortOrder: c.sortOrder,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});
