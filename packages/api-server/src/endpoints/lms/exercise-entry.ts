import { type Prisma } from "@prisma/client";

import {
  type CreateExerciseEntryInput,
  type UpdateExerciseEntryInput,
} from "@repo/contracts/lms/exercise-entry";

import { verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToExerciseEntry } from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

import { resolvePlanIdForExerciseEntry, resolvePlanIdForSetGroup } from "./plan-tree-helpers";

const toJsonInput = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

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

    try {
      const entry = await prisma.exerciseEntry.update({
        where: { id: entryId },
        data: {
          ...(data.order !== undefined ? { order: data.order } : {}),
          ...(data.exerciseId ? { exerciseId: data.exerciseId } : {}),
          ...(data.exerciseSnapshot !== undefined
            ? { exerciseSnapshot: toJsonInput(data.exerciseSnapshot) }
            : {}),
          ...(data.prescription !== undefined
            ? { prescription: toJsonInput(data.prescription) }
            : {}),
          ...(data.alternatives !== undefined
            ? { alternatives: toJsonInput(data.alternatives) }
            : {}),
          ...(data.externalUrl !== undefined ? { externalUrl: data.externalUrl } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
      });

      return mapToExerciseEntry(entry);
    } catch (error) {
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
