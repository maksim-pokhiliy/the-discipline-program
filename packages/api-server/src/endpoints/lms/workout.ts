import { Prisma } from "@prisma/client";

import { type TiptapDoc } from "@repo/contracts/common/tiptap-doc";
import {
  type CreateWorkoutData,
  type UpdateWorkoutData,
  type Workout,
} from "@repo/contracts/lms/workout";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { resolveCoachId, verifyPlanOwnership, verifyWorkoutOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { type TxClient } from "../../db/tx";
import { mapToWorkout } from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

import { copyWorkoutWeek } from "./workout/copy-week";
import { loadLibraryLookup } from "./workout/library-lookup";
import { parseTiptapDoc } from "./workout/parser";
import { persistWorkoutTree } from "./workout/persist-tree";

const toPrismaContentDoc = (
  value: CreateWorkoutData["contentDoc"] | UpdateWorkoutData["contentDoc"],
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
};

const toUTCMidnight = (date: Date): Date => {
  const hours = date.getUTCHours();
  const base = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  if (hours >= 12) {
    base.setUTCDate(base.getUTCDate() + 1);
  }

  return base;
};

const writeWorkoutDocAndBlocks = async (params: {
  tx: TxClient;
  workoutId: string;
  contentDoc: TiptapDoc | null;
  savingCoachUserId: string;
}): Promise<void> => {
  const { tx, workoutId, contentDoc, savingCoachUserId } = params;

  if (contentDoc === null) {
    await tx.workoutBlock.deleteMany({ where: { workoutId } });

    return;
  }

  const lookup = await loadLibraryLookup(contentDoc);
  const tree = parseTiptapDoc(contentDoc, lookup, { savingCoachUserId });

  await persistWorkoutTree({ workoutId, tree, tx });
};

export const lmsWorkoutApi = {
  getAll: async (userId: string, planId: string): Promise<Workout[]> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const workouts = await prisma.workout.findMany({
      where: { planId, isArchived: false },
      orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return workouts.map(mapToWorkout);
  },

  getById: async (userId: string, planId: string, id: string): Promise<Workout> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const workout = await prisma.workout.findUnique({
      where: { id },
    });

    if (!workout || workout.planId !== planId) {
      throw new NotFoundError("Workout not found", { id, planId });
    }

    return mapToWorkout(workout);
  },

  create: async (userId: string, planId: string, data: CreateWorkoutData): Promise<Workout> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const scheduledDate = data.scheduledDate ? toUTCMidnight(data.scheduledDate) : null;
    const { contentDoc, ...rest } = data;

    try {
      const workout = await prisma.$transaction(async (tx) => {
        await tx.workout.updateMany({
          where: { planId, scheduledDate },
          data: { sortOrder: { increment: 1 } },
        });

        const created = await tx.workout.create({
          data: {
            ...rest,
            planId,
            scheduledDate,
            sortOrder: 0,
            ...(contentDoc !== undefined ? { contentDoc: toPrismaContentDoc(contentDoc) } : {}),
          },
        });

        if (contentDoc !== undefined) {
          await writeWorkoutDocAndBlocks({
            tx,
            workoutId: created.id,
            contentDoc: contentDoc ?? null,
            savingCoachUserId: userId,
          });
        }

        return created;
      });

      return mapToWorkout(workout);
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }

      return handlePrismaError(error, { entity: "Workout" });
    }
  },

  update: async (
    userId: string,
    planId: string,
    id: string,
    data: UpdateWorkoutData,
  ): Promise<Workout> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const existing = await prisma.workout.findUnique({
      where: { id },
      select: { planId: true },
    });

    if (!existing || existing.planId !== planId) {
      throw new NotFoundError("Workout not found", { id, planId });
    }

    const { contentDoc, scheduledDate, ...rest } = data;

    try {
      const workout = await prisma.$transaction(async (tx) => {
        const updated = await tx.workout.update({
          where: { id },
          data: {
            ...rest,
            ...(scheduledDate !== undefined
              ? { scheduledDate: scheduledDate ? toUTCMidnight(scheduledDate) : null }
              : {}),
            ...(contentDoc !== undefined ? { contentDoc: toPrismaContentDoc(contentDoc) } : {}),
          },
        });

        if (contentDoc !== undefined) {
          await writeWorkoutDocAndBlocks({
            tx,
            workoutId: id,
            contentDoc: contentDoc ?? null,
            savingCoachUserId: userId,
          });
        }

        return updated;
      });

      return mapToWorkout(workout);
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }

      return handlePrismaError(error, { entity: "Workout" });
    }
  },

  delete: async (userId: string, planId: string, id: string): Promise<void> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const existing = await prisma.workout.findUnique({
      where: { id },
      select: { planId: true },
    });

    if (!existing || existing.planId !== planId) {
      throw new NotFoundError("Workout not found", { id, planId });
    }

    try {
      await prisma.workout.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Workout" });
    }
  },

  move: async (
    userId: string,
    workoutId: string,
    scheduledDate: Date,
    targetDayOrderedIds?: string[],
  ): Promise<Workout> => {
    const coachId = await resolveCoachId(userId);
    const normalizedDate = toUTCMidnight(scheduledDate);

    const owned = await verifyWorkoutOwnership(workoutId, coachId);

    try {
      if (targetDayOrderedIds) {
        const targetWorkouts = await prisma.workout.findMany({
          where: { id: { in: targetDayOrderedIds }, planId: owned.planId },
          select: { id: true },
        });

        const validIds = new Set(targetWorkouts.map((w) => w.id));

        if (targetDayOrderedIds.some((id) => !validIds.has(id))) {
          throw new BadRequestError(
            "targetDayOrderedIds contain workouts not belonging to this plan",
          );
        }

        await prisma.$transaction([
          prisma.workout.update({
            where: { id: workoutId },
            data: { scheduledDate: normalizedDate },
          }),
          ...targetDayOrderedIds.map((id, index) =>
            prisma.workout.update({ where: { id }, data: { sortOrder: index } }),
          ),
        ]);
      } else {
        await prisma.$transaction(async (tx) => {
          const maxOrder = await tx.workout.aggregate({
            where: { planId: owned.planId, scheduledDate: normalizedDate },
            _max: { sortOrder: true },
          });

          await tx.workout.update({
            where: { id: workoutId },
            data: { scheduledDate: normalizedDate, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
          });
        });
      }

      const workout = await findOrThrow(
        prisma.workout.findUnique({ where: { id: workoutId } }),
        "Workout",
      );

      return mapToWorkout(workout);
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }

      return handlePrismaError(error, { entity: "Workout" });
    }
  },

  reorder: async (userId: string, planId: string, orderedIds: string[]): Promise<void> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const workouts = await prisma.workout.findMany({
      where: { planId, id: { in: orderedIds } },
      select: { id: true },
    });

    const existingIds = new Set(workouts.map((w) => w.id));

    if (orderedIds.some((id) => !existingIds.has(id))) {
      throw new BadRequestError("orderedIds contain workouts not belonging to this plan");
    }

    try {
      await prisma.$transaction(
        orderedIds.map((id, index) =>
          prisma.workout.update({ where: { id }, data: { sortOrder: index } }),
        ),
      );
    } catch (error) {
      return handlePrismaError(error, { entity: "Workout" });
    }
  },

  copyWeek: copyWorkoutWeek,
};
