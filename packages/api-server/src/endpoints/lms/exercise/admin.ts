import { Prisma } from "@prisma/client";

import {
  type AdminExercisesPageData,
  type CreateExerciseData,
  type Exercise,
  type UpdateExerciseData,
} from "@repo/contracts/lms/exercise";
import { ConflictError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { mapToExercise, natureToPrisma } from "../../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../../utils";

const buildExerciseUpdateData = (data: UpdateExerciseData): Prisma.ExerciseUpdateInput => ({
  ...(data.canonicalName !== undefined && {
    canonicalName: data.canonicalName,
    canonicalNameLower: data.canonicalName.trim().toLowerCase(),
  }),
  ...(data.nature !== undefined && { nature: natureToPrisma[data.nature] }),
  ...(data.movementFamily !== undefined && { movementFamily: data.movementFamily }),
  ...(data.defaultDemoUrls !== undefined && { defaultDemoUrls: data.defaultDemoUrls }),
  ...(data.aliases !== undefined && { aliases: data.aliases }),
  ...(data.notes !== undefined && { notes: data.notes }),
});

export const cmsExerciseAdminApi = {
  getExercises: async (): Promise<Exercise[]> => {
    const rows = await prisma.exercise.findMany({ orderBy: { createdAt: "desc" } });

    return rows.map(mapToExercise);
  },

  getExerciseById: async (id: string): Promise<Exercise> => {
    const row = await findOrThrow(prisma.exercise.findUnique({ where: { id } }), "Exercise");

    return mapToExercise(row);
  },

  createExercise: async (data: CreateExerciseData): Promise<Exercise> => {
    const canonicalNameLower = data.canonicalName.trim().toLowerCase();

    try {
      const created = await prisma.exercise.create({
        data: {
          canonicalName: data.canonicalName,
          canonicalNameLower,
          nature: natureToPrisma[data.nature],
          movementFamily: data.movementFamily ?? null,
          defaultDemoUrls: data.defaultDemoUrls,
          aliases: data.aliases,
          notes: data.notes ?? null,
        },
      });

      return mapToExercise(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Exercise with this name already exists", {
          field: "canonicalName",
        });
      }

      return handlePrismaError(error, { entity: "Exercise" });
    }
  },

  updateExercise: async (id: string, data: UpdateExerciseData): Promise<Exercise> => {
    await findOrThrow(prisma.exercise.findUnique({ where: { id } }), "Exercise");

    try {
      const updated = await prisma.exercise.update({
        where: { id },
        data: buildExerciseUpdateData(data),
      });

      return mapToExercise(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Exercise with this name already exists", {
          field: "canonicalName",
        });
      }

      return handlePrismaError(error, { entity: "Exercise" });
    }
  },

  deleteExercise: async (id: string): Promise<void> => {
    await findOrThrow(prisma.exercise.findUnique({ where: { id } }), "Exercise");

    try {
      await prisma.exercise.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictError(
          "Cannot delete: exercise is referenced by 1RM records or schema rows",
          { entity: "Exercise", relation: "oneRMRecords/schemaRows" },
        );
      }

      return handlePrismaError(error, { entity: "Exercise" });
    }
  },

  getExercisesPageData: async (): Promise<AdminExercisesPageData> => {
    const exercises = await cmsExerciseAdminApi.getExercises();

    return { exercises };
  },

  getMovementFamilies: async (): Promise<string[]> => {
    const rows = await prisma.exercise.findMany({
      where: { movementFamily: { not: null } },
      distinct: ["movementFamily"],
      select: { movementFamily: true },
      orderBy: { movementFamily: "asc" },
    });

    return rows
      .map((row) => row.movementFamily)
      .filter((family): family is string => family !== null);
  },
};
