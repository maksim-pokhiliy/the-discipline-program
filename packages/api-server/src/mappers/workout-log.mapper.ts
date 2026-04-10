import { type WorkoutLog as PrismaWorkoutLog } from "@prisma/client";

import { type WorkoutLog } from "@repo/contracts/lms/workout-log";

export const mapToWorkoutLog = (log: PrismaWorkoutLog): WorkoutLog => ({
  id: log.id,
  userId: log.userId,
  workoutId: log.workoutId,
  date: log.date,
  notes: log.notes,
  isRx: log.isRx,
  createdAt: log.createdAt,
  updatedAt: log.updatedAt,
});
