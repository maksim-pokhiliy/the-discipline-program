import { Prisma } from "@prisma/client";

import {
  type AdminExercisesPageData,
  type CreateExerciseData,
  type Exercise,
  type UpdateExerciseData,
} from "@repo/contracts/lms/exercise";
import { BadRequestError, ConflictError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { mapToExercise, natureToPrisma } from "../../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../../utils";
import { type TxClient } from "../_shared";

export const EXERCISE_WITH_EQUIPMENT_INCLUDE = {
  equipmentAssignments: {
    include: { equipment: true },
    orderBy: { order: "asc" as const },
  },
} satisfies Prisma.ExerciseInclude;

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

const assertEquipmentExists = async (
  tx: TxClient,
  equipmentIds: readonly string[],
): Promise<void> => {
  if (equipmentIds.length === 0) {
    return;
  }

  const found = await tx.equipment.findMany({
    where: { id: { in: [...equipmentIds] } },
    select: { id: true },
  });

  if (found.length !== equipmentIds.length) {
    const missing = equipmentIds.filter((id) => !found.some((e) => e.id === id));

    throw new BadRequestError("Equipment not found", { missing });
  }
};

const replaceExerciseEquipment = async (
  tx: TxClient,
  exerciseId: string,
  equipmentIds: readonly string[],
): Promise<void> => {
  await tx.exerciseEquipmentAssignment.deleteMany({ where: { exerciseId } });

  if (equipmentIds.length > 0) {
    await tx.exerciseEquipmentAssignment.createMany({
      data: equipmentIds.map((equipmentId, i) => ({ exerciseId, equipmentId, order: i })),
    });
  }
};

export const cmsExerciseAdminApi = {
  getExercises: async (): Promise<Exercise[]> => {
    const rows = await prisma.exercise.findMany({
      orderBy: { createdAt: "desc" },
      include: EXERCISE_WITH_EQUIPMENT_INCLUDE,
    });

    return rows.map(mapToExercise);
  },

  getExerciseById: async (id: string): Promise<Exercise> => {
    const row = await findOrThrow(
      prisma.exercise.findUnique({ where: { id }, include: EXERCISE_WITH_EQUIPMENT_INCLUDE }),
      "Exercise",
    );

    return mapToExercise(row);
  },

  createExercise: async (data: CreateExerciseData): Promise<Exercise> => {
    const canonicalNameLower = data.canonicalName.trim().toLowerCase();

    try {
      const row = await prisma.$transaction(async (tx) => {
        await assertEquipmentExists(tx, data.equipmentIds ?? []);

        const created = await tx.exercise.create({
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

        await replaceExerciseEquipment(tx, created.id, data.equipmentIds ?? []);

        return tx.exercise.findUniqueOrThrow({
          where: { id: created.id },
          include: EXERCISE_WITH_EQUIPMENT_INCLUDE,
        });
      });

      return mapToExercise(row);
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
      const row = await prisma.$transaction(async (tx) => {
        if (data.equipmentIds !== undefined) {
          await assertEquipmentExists(tx, data.equipmentIds);
        }

        await tx.exercise.update({
          where: { id },
          data: buildExerciseUpdateData(data),
        });

        if (data.equipmentIds !== undefined) {
          await replaceExerciseEquipment(tx, id, data.equipmentIds);
        }

        return tx.exercise.findUniqueOrThrow({
          where: { id },
          include: EXERCISE_WITH_EQUIPMENT_INCLUDE,
        });
      });

      return mapToExercise(row);
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
          { entity: "Exercise", relation: "oneRMRecords" },
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
