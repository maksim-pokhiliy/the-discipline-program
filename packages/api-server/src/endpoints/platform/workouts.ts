import { type Workout as PrismaWorkout } from "@prisma/client";

import {
  type CreateWorkoutData,
  type UpdateWorkoutData,
  type Workout,
} from "@repo/contracts/workout";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToWorkout } from "../../mappers";

import { resolveCoachId, verifyPlanOwnership, verifyWorkoutOwnership } from "./guards";

export const platformWorkoutsApi = {
  getAll: async (userId: string, planId: string): Promise<Workout[]> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const workouts = await prisma.workout.findMany({
      where: { planId, deletedAt: null },
      include: { _count: { select: { blocks: true } } },
      orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return workouts.map(mapToWorkout);
  },

  getById: async (userId: string, planId: string, id: string): Promise<Workout> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const workout = await prisma.workout.findUnique({
      where: { id },
      include: { _count: { select: { blocks: true } } },
    });

    if (!workout || workout.deletedAt || workout.planId !== planId) {
      throw new NotFoundError("Workout not found", { id, planId });
    }

    return mapToWorkout(workout);
  },

  create: async (userId: string, planId: string, data: CreateWorkoutData): Promise<Workout> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const maxOrder = await prisma.workout.aggregate({
      where: { planId, scheduledDate: data.scheduledDate ?? null, deletedAt: null },
      _max: { sortOrder: true },
    });

    const workout = await prisma.workout.create({
      data: { planId, ...data, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
      include: { _count: { select: { blocks: true } } },
    });

    return mapToWorkout(workout);
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
      select: { planId: true, deletedAt: true },
    });

    if (!existing || existing.deletedAt || existing.planId !== planId) {
      throw new NotFoundError("Workout not found", { id, planId });
    }

    const workout = await prisma.workout.update({
      where: { id },
      data,
      include: { _count: { select: { blocks: true } } },
    });

    return mapToWorkout(workout);
  },

  delete: async (userId: string, planId: string, id: string): Promise<void> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const existing = await prisma.workout.findUnique({
      where: { id },
      select: { planId: true, deletedAt: true },
    });

    if (!existing || existing.deletedAt || existing.planId !== planId) {
      throw new NotFoundError("Workout not found", { id, planId });
    }

    await prisma.workout.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  move: async (
    userId: string,
    workoutId: string,
    scheduledDate: Date,
    targetDayOrderedIds?: string[],
  ): Promise<Workout> => {
    const coachId = await resolveCoachId(userId);

    const owned = await verifyWorkoutOwnership(workoutId, coachId);

    if (targetDayOrderedIds) {
      await prisma.$transaction([
        prisma.workout.update({
          where: { id: workoutId },
          data: { scheduledDate },
        }),
        ...targetDayOrderedIds.map((id, index) =>
          prisma.workout.update({ where: { id }, data: { sortOrder: index } }),
        ),
      ]);
    } else {
      const maxOrder = await prisma.workout.aggregate({
        where: { planId: owned.planId, scheduledDate, deletedAt: null },
        _max: { sortOrder: true },
      });

      await prisma.workout.update({
        where: { id: workoutId },
        data: { scheduledDate, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
      });
    }

    const workout = await prisma.workout.findUniqueOrThrow({
      where: { id: workoutId },
      include: { _count: { select: { blocks: true } } },
    });

    return mapToWorkout(workout);
  },

  reorder: async (userId: string, planId: string, orderedIds: string[]): Promise<void> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const workouts = await prisma.workout.findMany({
      where: { planId, deletedAt: null, id: { in: orderedIds } },
      select: { id: true },
    });

    const existingIds = new Set(workouts.map((w) => w.id));

    if (orderedIds.some((id) => !existingIds.has(id))) {
      throw new BadRequestError("orderedIds contain workouts not belonging to this plan");
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.workout.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
  },

  reorderBlocks: async (userId: string, workoutId: string, orderedIds: string[]): Promise<void> => {
    const coachId = await resolveCoachId(userId);

    await verifyWorkoutOwnership(workoutId, coachId);

    const blocks = await prisma.workoutBlock.findMany({
      where: { workoutId },
      select: { id: true },
    });

    const existingIds = new Set(blocks.map((b) => b.id));

    if (
      new Set(orderedIds).size !== existingIds.size ||
      orderedIds.some((id) => !existingIds.has(id))
    ) {
      throw new BadRequestError("orderedIds must match all blocks in the workout");
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.workoutBlock.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
  },

  copyWeek: async (
    userId: string,
    planId: string,
    sourceDate: Date,
    targetDate: Date,
  ): Promise<Workout[]> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const sourceEnd = new Date(sourceDate);

    sourceEnd.setDate(sourceEnd.getDate() + 7);

    const sourceWorkouts = await prisma.workout.findMany({
      where: {
        planId,
        deletedAt: null,
        scheduledDate: { gte: sourceDate, lt: sourceEnd },
      },
      include: {
        blocks: {
          include: { sets: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (sourceWorkouts.length === 0) {
      return [];
    }

    const dayShiftMs = targetDate.getTime() - sourceDate.getTime();

    const created = await prisma.$transaction(async (tx) => {
      const results: (PrismaWorkout & { _count: { blocks: number } })[] = [];

      for (const workout of sourceWorkouts) {
        const newDate = workout.scheduledDate
          ? new Date(workout.scheduledDate.getTime() + dayShiftMs)
          : null;

        const newWorkout = await tx.workout.create({
          data: {
            planId,
            scheduledDate: newDate,
            title: workout.title,
            description: workout.description,
            sortOrder: workout.sortOrder,
          },
          include: { _count: { select: { blocks: true } } },
        });

        for (const block of workout.blocks) {
          const newBlock = await tx.workoutBlock.create({
            data: {
              workoutId: newWorkout.id,
              categoryId: block.categoryId,
              rounds: block.rounds,
              timeCapSec: block.timeCapSec,
              sortOrder: block.sortOrder,
            },
          });

          if (block.sets.length > 0) {
            await tx.prescribedSet.createMany({
              data: block.sets.map((s) => ({
                blockId: newBlock.id,
                exerciseId: s.exerciseId,
                sets: s.sets,
                reps: s.reps,
                weightValue: s.weightValue,
                weightUnit: s.weightUnit,
                weightType: s.weightType,
                rpe: s.rpe,
                notes: s.notes,
                sortOrder: s.sortOrder,
              })),
            });
          }
        }

        results.push(newWorkout);
      }

      return results;
    });

    return created.map(mapToWorkout);
  },
};
