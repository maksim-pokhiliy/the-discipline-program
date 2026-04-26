import { type Prisma } from "@prisma/client";

import { type ExerciseSnapshot } from "@repo/contracts/lms/_domain";
import {
  type CreateExerciseEntryInput,
  type UpdateExerciseEntryInput,
} from "@repo/contracts/lms/exercise-entry";
import { ConflictError, NotFoundError } from "@repo/errors";

import { verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import {
  BODY_PART_MAP,
  mapToExerciseEntry,
  MODALITY_MAP,
  MOVEMENT_PATTERN_MAP,
} from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

import { resolvePlanIdForExerciseEntry, resolvePlanIdForSetGroup } from "./plan-tree-helpers";

const toJsonInput = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

const deriveExerciseSnapshot = async (exerciseId: string): Promise<ExerciseSnapshot> => {
  const exercise = await findOrThrow(
    prisma.exerciseLibraryItem.findUnique({ where: { id: exerciseId } }),
    "Exercise library item",
  );

  return {
    id: exercise.id,
    name: exercise.name,
    primaryMovement: MOVEMENT_PATTERN_MAP[exercise.primaryMovement],
    modality: MODALITY_MAP[exercise.modality],
    primaryBodyParts: exercise.primaryBodyParts.map((bp) => BODY_PART_MAP[bp]),
    defaultMetrics: exercise.defaultMetrics,
    demoVideoUrl: exercise.demoVideoUrl,
    demoImageUrl: exercise.demoImageUrl,
  };
};

export const lmsExerciseEntryApi = {
  getById: async (userId: string, entryId: string) => {
    const planId = await resolvePlanIdForExerciseEntry(entryId);

    await verifyPlanOwnership(planId, userId);

    const entry = await findOrThrow(
      prisma.exerciseEntry.findUnique({ where: { id: entryId } }),
      "Exercise entry",
    );

    return mapToExerciseEntry(entry);
  },

  create: async (userId: string, data: CreateExerciseEntryInput) => {
    const planId = await resolvePlanIdForSetGroup(data.setGroupId);

    await verifyPlanOwnership(planId, userId);

    try {
      const entry = await prisma.exerciseEntry.create({
        data: {
          setGroupId: data.setGroupId,
          order: data.order,
          exerciseId: data.exerciseId,
          exerciseSnapshot: toJsonInput(data.exerciseSnapshot),
          prescription: toJsonInput(data.prescription),
          alternatives: toJsonInput(data.alternatives),
          externalUrl: data.externalUrl ?? null,
          notes: data.notes ?? null,
        },
      });

      return mapToExerciseEntry(entry);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise entry" });
    }
  },

  update: async (userId: string, entryId: string, data: UpdateExerciseEntryInput) => {
    const planId = await resolvePlanIdForExerciseEntry(entryId);

    await verifyPlanOwnership(planId, userId);

    const serverSnapshot = await deriveExerciseSnapshot(data.exerciseId);

    try {
      const result = await prisma.exerciseEntry.updateMany({
        where: { id: entryId, version: data.expectedVersion },
        data: {
          order: data.order,
          exerciseId: data.exerciseId,
          exerciseSnapshot: toJsonInput(serverSnapshot),
          prescription: toJsonInput(data.prescription),
          alternatives: toJsonInput(data.alternatives),
          externalUrl: data.externalUrl,
          notes: data.notes,
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        const current = await prisma.exerciseEntry.findUnique({
          where: { id: entryId },
          select: { version: true },
        });

        if (!current) {
          throw new NotFoundError("Exercise entry not found", { entryId });
        }

        throw new ConflictError("Exercise entry version conflict", {
          entryId,
          currentVersion: current.version,
          expectedVersion: data.expectedVersion,
        });
      }

      const entry = await findOrThrow(
        prisma.exerciseEntry.findUnique({ where: { id: entryId } }),
        "Exercise entry",
      );

      return mapToExerciseEntry(entry);
    } catch (error) {
      if (error instanceof ConflictError || error instanceof NotFoundError) {
        throw error;
      }

      return handlePrismaError(error, { entity: "Exercise entry" });
    }
  },

  delete: async (userId: string, entryId: string): Promise<void> => {
    const planId = await resolvePlanIdForExerciseEntry(entryId);

    await verifyPlanOwnership(planId, userId);

    try {
      await prisma.exerciseEntry.delete({ where: { id: entryId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise entry" });
    }
  },
};
