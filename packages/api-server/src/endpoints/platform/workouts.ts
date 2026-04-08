import {
  type CreateWorkoutData,
  type UpdateWorkoutData,
  type Workout,
} from "@repo/contracts/workout";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToWorkout } from "../../mappers";
import { findOrThrow, handlePrismaError } from "../../utils";

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

    try {
      await prisma.workout.updateMany({
        where: { planId, scheduledDate },
        data: { sortOrder: { increment: 1 } },
      });

      const workout = await prisma.workout.create({
        data: { ...data, planId, scheduledDate, sortOrder: 0 },
      });

      return mapToWorkout(workout);
    } catch (error) {
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

    try {
      const workout = await prisma.workout.update({
        where: { id },
        data: data.scheduledDate
          ? { ...data, scheduledDate: toUTCMidnight(data.scheduledDate) }
          : data,
      });

      return mapToWorkout(workout);
    } catch (error) {
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
      orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (sourceWorkouts.length === 0) {
      return [];
    }

    const dayShiftMs = normalizedTarget.getTime() - normalizedSource.getTime();

    try {
      const created = await prisma.$transaction(async (tx) => {
        const existingIds = (
          await tx.workout.findMany({
            where: { planId },
            select: { id: true },
          })
        ).map((w) => w.id);

        await tx.workout.createMany({
          data: sourceWorkouts.map((workout) => ({
            planId,
            scheduledDate: workout.scheduledDate
              ? toUTCMidnight(new Date(workout.scheduledDate.getTime() + dayShiftMs))
              : null,
            title: workout.title,
            description: workout.description,
            content: workout.content,
            sortOrder: workout.sortOrder,
          })),
        });

        return tx.workout.findMany({
          where: { planId, id: { notIn: existingIds } },
          orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }],
        });
      });

      return created.map(mapToWorkout);
    } catch (error) {
      return handlePrismaError(error, { entity: "Workout" });
    }
  },
};
