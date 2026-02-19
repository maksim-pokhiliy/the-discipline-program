import {
  type CreateWorkoutData,
  type UpdateWorkoutData,
  type Workout,
} from "@repo/contracts/workout";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToWorkout } from "../../mappers";

import { resolveCoachId, verifyPlanOwnership } from "./guards";

export const platformWorkoutsApi = {
  getAll: async (userId: string, planId: string): Promise<Workout[]> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const workouts = await prisma.workout.findMany({
      where: { planId, deletedAt: null },
      orderBy: { dayOrder: "asc" },
    });

    return workouts.map(mapToWorkout);
  },

  getById: async (userId: string, planId: string, id: string): Promise<Workout> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const workout = await prisma.workout.findUnique({
      where: { id },
    });

    if (!workout || workout.deletedAt || workout.planId !== planId) {
      throw new NotFoundError("Workout not found", { id, planId });
    }

    return mapToWorkout(workout);
  },

  create: async (userId: string, planId: string, data: CreateWorkoutData): Promise<Workout> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const workout = await prisma.workout.create({
      data: { planId, ...data },
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
};
