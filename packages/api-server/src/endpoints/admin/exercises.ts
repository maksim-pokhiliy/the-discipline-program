import {
  type CreateExerciseData,
  type Exercise,
  type UpdateExerciseData,
} from "@repo/contracts/exercise";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToExercise } from "../../mappers";
import { handlePrismaError } from "../../utils";

import { adminExerciseCategoriesApi } from "./exercise-categories";

const includeWithCategory = { category: true } as const;

export const adminExercisesApi = {
  getAll: async (): Promise<Exercise[]> => {
    const exercises = await prisma.exercise.findMany({
      include: includeWithCategory,
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
    });

    return exercises.map(mapToExercise);
  },

  getById: async (id: string): Promise<Exercise | null> => {
    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: includeWithCategory,
    });

    if (!exercise) {
      return null;
    }

    return mapToExercise(exercise);
  },

  getPageData: async () => {
    const [exercises, categories] = await Promise.all([
      adminExercisesApi.getAll(),
      adminExerciseCategoriesApi.getAll(),
    ]);

    return { exercises, categories };
  },

  create: async (data: CreateExerciseData): Promise<Exercise> => {
    try {
      const exercise = await prisma.exercise.create({
        data: {
          name: data.name,
          description: data.description,
          videoUrl: data.videoUrl || null,
          categoryId: data.categoryId,
        },
        include: includeWithCategory,
      });

      return mapToExercise(exercise);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise", field: "name" });
    }
  },

  update: async (id: string, data: UpdateExerciseData): Promise<Exercise> => {
    try {
      const updateData: Record<string, unknown> = {};

      if (data.name !== undefined) {
        updateData.name = data.name;
      }

      if (data.description !== undefined) {
        updateData.description = data.description;
      }

      if (data.videoUrl !== undefined) {
        updateData.videoUrl = data.videoUrl || null;
      }

      if (data.categoryId !== undefined) {
        updateData.categoryId = data.categoryId;
      }

      const exercise = await prisma.exercise.update({
        where: { id },
        data: updateData,
        include: includeWithCategory,
      });

      return mapToExercise(exercise);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise", field: "name" });
    }
  },

  delete: async (id: string): Promise<void> => {
    const exercise = await prisma.exercise.findUnique({ where: { id } });

    if (!exercise) {
      throw new NotFoundError("Exercise not found", { id });
    }

    await prisma.exercise.delete({ where: { id } });
  },
};
