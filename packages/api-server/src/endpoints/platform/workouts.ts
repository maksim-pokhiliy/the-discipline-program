import {
  type CreateWorkoutData,
  type UpdateWorkoutData,
  type Workout,
  type WorkoutPreview,
} from "@repo/contracts/workout";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToWorkout } from "../../mappers";
import {
  SCORE_TYPE_MAP,
  SECTION_TYPE_MAP,
  UNIT_MAP,
  WEIGHT_TYPE_MAP,
} from "../../mappers/enum-maps";

import { resolveCoachId, verifyPlanOwnership, verifyWorkoutOwnership } from "./guards";

const toUTCMidnight = (date: Date): Date => {
  const hours = date.getUTCHours();
  const base = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  if (hours >= 12) {
    base.setUTCDate(base.getUTCDate() + 1);
  }

  return base;
};

export const platformWorkoutsApi = {
  getAll: async (userId: string, planId: string): Promise<Workout[]> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const workouts = await prisma.workout.findMany({
      where: { planId },
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

    if (!workout || workout.planId !== planId) {
      throw new NotFoundError("Workout not found", { id, planId });
    }

    return mapToWorkout(workout);
  },

  getPreview: async (userId: string, planId: string, id: string): Promise<WorkoutPreview> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const workout = await prisma.workout.findUnique({
      where: { id },
      select: {
        planId: true,
        blocks: {
          orderBy: { sortOrder: "asc" },
          include: {
            category: true,
            sets: {
              orderBy: { sortOrder: "asc" },
              include: { exercise: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!workout || workout.planId !== planId) {
      throw new NotFoundError("Workout not found", { id, planId });
    }

    return {
      blocks: workout.blocks.map((block) => ({
        id: block.id,
        sectionType: SECTION_TYPE_MAP[block.sectionType],
        scoreType: SCORE_TYPE_MAP[block.scoreType],
        title: block.title,
        categoryName: block.category?.name ?? null,
        notes: block.notes,
        rounds: block.rounds,
        timeCapSec: block.timeCapSec,
        intervalSec: block.intervalSec,
        workSec: block.workSec,
        restSec: block.restSec,
        restAfterSec: block.restAfterSec,
        exercises: block.sets.map((set) => ({
          name: set.exercise.name,
          reps: set.reps,
          weightValue: set.weightValue ? Number(set.weightValue) : null,
          weightUnit: UNIT_MAP[set.weightUnit],
          weightType: WEIGHT_TYPE_MAP[set.weightType],
          rpe: set.rpe,
        })),
      })),
    };
  },

  create: async (userId: string, planId: string, data: CreateWorkoutData): Promise<Workout> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const scheduledDate = data.scheduledDate ? toUTCMidnight(data.scheduledDate) : null;

    await prisma.workout.updateMany({
      where: { planId, scheduledDate },
      data: { sortOrder: { increment: 1 } },
    });

    const workout = await prisma.workout.create({
      data: { ...data, planId, scheduledDate, sortOrder: 0 },
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
      select: { planId: true },
    });

    if (!existing || existing.planId !== planId) {
      throw new NotFoundError("Workout not found", { id, planId });
    }

    const workout = await prisma.workout.update({
      where: { id },
      data: data.scheduledDate
        ? { ...data, scheduledDate: toUTCMidnight(data.scheduledDate) }
        : data,
      include: { _count: { select: { blocks: true } } },
    });

    return mapToWorkout(workout);
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

    await prisma.workout.delete({ where: { id } });
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
          where: { planId: owned.planId, scheduledDate: normalizedDate, deletedAt: null },
          _max: { sortOrder: true },
        });

        await tx.workout.update({
          where: { id: workoutId },
          data: { scheduledDate: normalizedDate, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
        });
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
      where: { planId, id: { in: orderedIds } },
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

    const normalizedSource = toUTCMidnight(sourceDate);
    const normalizedTarget = toUTCMidnight(targetDate);

    const sourceEnd = new Date(normalizedSource);

    sourceEnd.setUTCDate(sourceEnd.getUTCDate() + 7);

    const sourceWorkouts = await prisma.workout.findMany({
      where: {
        planId,
        scheduledDate: { gte: normalizedSource, lt: sourceEnd },
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

    const dayShiftMs = normalizedTarget.getTime() - normalizedSource.getTime();

    const created = await prisma.$transaction(async (tx) => {
      const createdIds: string[] = [];

      for (const workout of sourceWorkouts) {
        const newDate = workout.scheduledDate
          ? toUTCMidnight(new Date(workout.scheduledDate.getTime() + dayShiftMs))
          : null;

        const newWorkout = await tx.workout.create({
          data: {
            planId,
            scheduledDate: newDate,
            title: workout.title,
            description: workout.description,
            sortOrder: workout.sortOrder,
          },
        });

        for (const block of workout.blocks) {
          const newBlock = await tx.workoutBlock.create({
            data: {
              workoutId: newWorkout.id,
              categoryId: block.categoryId,
              sectionType: block.sectionType,
              scoreType: block.scoreType,
              title: block.title,
              notes: block.notes,
              rounds: block.rounds,
              timeCapSec: block.timeCapSec,
              intervalSec: block.intervalSec,
              workSec: block.workSec,
              restSec: block.restSec,
              restAfterSec: block.restAfterSec,
              sortOrder: block.sortOrder,
            },
          });

          if (block.sets.length > 0) {
            await tx.prescribedSet.createMany({
              data: block.sets.map((s) => ({
                blockId: newBlock.id,
                exerciseId: s.exerciseId,
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

        createdIds.push(newWorkout.id);
      }

      return tx.workout.findMany({
        where: { id: { in: createdIds } },
        include: { _count: { select: { blocks: true } } },
        orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }],
      });
    });

    return created.map(mapToWorkout);
  },
};
