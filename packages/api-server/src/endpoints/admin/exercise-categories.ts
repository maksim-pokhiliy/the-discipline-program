import {
  type CreateExerciseCategoryData,
  type ExerciseCategory,
  type UpdateExerciseCategoryData,
} from "@repo/contracts/exercise-category";
import { ConflictError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToExerciseCategory } from "../../mappers";
import { handlePrismaError } from "../../utils";

export const adminExerciseCategoriesApi = {
  getAll: async (): Promise<ExerciseCategory[]> => {
    const categories = await prisma.exerciseCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return categories.map(mapToExerciseCategory);
  },

  create: async (data: CreateExerciseCategoryData): Promise<ExerciseCategory> => {
    try {
      const category = await prisma.exerciseCategory.create({ data });

      return mapToExerciseCategory(category);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise category", field: "name" });
    }
  },

  update: async (id: string, data: UpdateExerciseCategoryData): Promise<ExerciseCategory> => {
    try {
      const category = await prisma.exerciseCategory.update({
        where: { id },
        data,
      });

      return mapToExerciseCategory(category);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise category", field: "name" });
    }
  },

  delete: async (id: string): Promise<void> => {
    const category = await prisma.exerciseCategory.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundError("Exercise category not found", { id });
    }

    const exerciseCount = await prisma.exercise.count({
      where: { categoryId: id, deletedAt: null },
    });

    if (exerciseCount > 0) {
      throw new ConflictError(
        `Cannot delete category with ${exerciseCount} assigned exercise(s). Reassign them first.`,
        { id, exerciseCount },
      );
    }

    await prisma.exerciseCategory.delete({ where: { id } });
  },
};
