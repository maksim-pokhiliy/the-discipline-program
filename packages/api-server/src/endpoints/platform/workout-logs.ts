import { PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";
import { type CreateWorkoutLogData, type WorkoutLog } from "@repo/contracts/workout-log";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToWorkoutLog } from "../../mappers";
import { PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP } from "../../mappers/enum-maps";
import { handlePrismaError } from "../../utils";

export const platformWorkoutLogsApi = {
  getAll: async (userId: string): Promise<WorkoutLog[]> => {
    const logs = await prisma.workoutLog.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    return logs.map(mapToWorkoutLog);
  },

  getById: async (userId: string, id: string): Promise<WorkoutLog> => {
    const log = await prisma.workoutLog.findUnique({
      where: { id },
    });

    if (!log || log.userId !== userId) {
      throw new NotFoundError("Workout log not found", { id });
    }

    return mapToWorkoutLog(log);
  },

  create: async (userId: string, data: CreateWorkoutLogData): Promise<WorkoutLog> => {
    const workout = await prisma.workout.findUnique({
      where: { id: data.workoutId },
      select: { id: true, planId: true },
    });

    if (!workout) {
      throw new NotFoundError("Workout not found", { workoutId: data.workoutId });
    }

    const enrollment = await prisma.planEnrollment.findFirst({
      where: {
        userId,
        trainingPlanId: workout.planId,
        status: PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP[PlanEnrollmentStatus.ACTIVE],
      },
      select: { id: true },
    });

    if (!enrollment) {
      throw new ForbiddenError("User is not enrolled in the plan for this workout");
    }

    try {
      const log = await prisma.workoutLog.create({
        data: {
          userId,
          ...data,
        },
      });

      return mapToWorkoutLog(log);
    } catch (error) {
      return handlePrismaError(error, { entity: "Workout log" });
    }
  },

  delete: async (userId: string, id: string): Promise<void> => {
    const existing = await prisma.workoutLog.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError("Workout log not found", { id });
    }

    try {
      await prisma.workoutLog.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Workout log" });
    }
  },
};
