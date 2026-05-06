import {
  type AdminExercisesPageData,
  type CreateExerciseData,
  type Exercise,
  type UpdateExerciseData,
} from "@repo/contracts/lms/exercise";
import { ConflictError } from "@repo/errors";

import { prisma } from "../../../../db/client";
import { mapToExercise } from "../../../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../../../utils";

const ensureUniqueName = async (name: string, excludeId?: string): Promise<void> => {
  const existing = await prisma.exercise.findFirst({
    where: {
      name,
      ...(excludeId !== undefined && { id: { not: excludeId } }),
    },
  });

  if (existing) {
    throw new ConflictError("Exercise with this name already exists", { field: "name" });
  }
};

export const lmsExerciseAdminApi = {
  getExercises: async (): Promise<Exercise[]> => {
    const exercises = await prisma.exercise.findMany({
      orderBy: { createdAt: "desc" },
    });

    return exercises.map(mapToExercise);
  },

  getExerciseById: async (id: string): Promise<Exercise> => {
    const exercise = await findOrThrow(prisma.exercise.findUnique({ where: { id } }), "Exercise");

    return mapToExercise(exercise);
  },

  createExercise: async (data: CreateExerciseData): Promise<Exercise> => {
    await ensureUniqueName(data.name);

    try {
      const exercise = await prisma.exercise.create({
        data: {
          name: data.name,
          urls: data.urls ?? [],
          primaryMovement: data.primaryMovement,
          ...(data.benchmarkPrKind !== undefined && { benchmarkPrKind: data.benchmarkPrKind }),
        },
      });

      return mapToExercise(exercise);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise", field: "name" });
    }
  },

  updateExercise: async (id: string, data: UpdateExerciseData): Promise<Exercise> => {
    await findOrThrow(prisma.exercise.findUnique({ where: { id } }), "Exercise");

    if (data.name !== undefined) {
      await ensureUniqueName(data.name, id);
    }

    try {
      const exercise = await prisma.exercise.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.urls !== undefined && { urls: data.urls }),
          ...(data.primaryMovement !== undefined && { primaryMovement: data.primaryMovement }),
          ...(data.benchmarkPrKind !== undefined && { benchmarkPrKind: data.benchmarkPrKind }),
        },
      });

      return mapToExercise(exercise);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise", field: "name" });
    }
  },

  deleteExercise: async (id: string): Promise<void> => {
    try {
      await prisma.exercise.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise" });
    }
  },

  getExercisesPageData: async (): Promise<AdminExercisesPageData> => {
    const exercises = await lmsExerciseAdminApi.getExercises();

    return { exercises };
  },
};
