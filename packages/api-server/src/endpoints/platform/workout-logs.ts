import { type CreateWorkoutLogData, type WorkoutLog } from "@repo/contracts/workout-log";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToWorkoutLog } from "../../mappers";

const includeSetLogs = { setLogs: true } as const;

export const platformWorkoutLogsApi = {
  getAll: async (userId: string): Promise<WorkoutLog[]> => {
    const logs = await prisma.workoutLog.findMany({
      where: { userId },
      include: includeSetLogs,
      orderBy: { date: "desc" },
    });

    return logs.map(mapToWorkoutLog);
  },

  getById: async (userId: string, id: string): Promise<WorkoutLog> => {
    const log = await prisma.workoutLog.findUnique({
      where: { id },
      include: includeSetLogs,
    });

    if (!log || log.userId !== userId) {
      throw new NotFoundError("Workout log not found", { id });
    }

    return mapToWorkoutLog(log);
  },

  create: async (userId: string, data: CreateWorkoutLogData): Promise<WorkoutLog> => {
    const workout = await prisma.workout.findUnique({
      where: { id: data.workoutId },
      select: { id: true, deletedAt: true },
    });

    if (!workout || workout.deletedAt) {
      throw new NotFoundError("Workout not found", { workoutId: data.workoutId });
    }

    const { setLogs, ...logData } = data;

    const log = await prisma.workoutLog.create({
      data: {
        userId,
        ...logData,
        setLogs: {
          create: setLogs,
        },
      },
      include: includeSetLogs,
    });

    return mapToWorkoutLog(log);
  },

  delete: async (userId: string, id: string): Promise<void> => {
    const existing = await prisma.workoutLog.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError("Workout log not found", { id });
    }

    await prisma.workoutLog.delete({ where: { id } });
  },
};
