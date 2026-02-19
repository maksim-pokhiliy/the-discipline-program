import { type SetLog as PrismaSetLog, type WorkoutLog as PrismaWorkoutLog } from "@prisma/client";

import { type SetLog, type WorkoutLog } from "@repo/contracts/workout-log";

export const mapToSetLog = (s: PrismaSetLog): SetLog => ({
  id: s.id,
  workoutLogId: s.workoutLogId,
  prescribedSetId: s.prescribedSetId,
  substitutionExerciseId: s.substitutionExerciseId,
  repsDone: s.repsDone,
  weightDone: s.weightDone ? Number(s.weightDone) : null,
  rpeActual: s.rpeActual,
});

type PrismaWorkoutLogWithSets = PrismaWorkoutLog & { setLogs: PrismaSetLog[] };

export const mapToWorkoutLog = (log: PrismaWorkoutLogWithSets): WorkoutLog => ({
  id: log.id,
  userId: log.userId,
  workoutId: log.workoutId,
  date: log.date,
  notes: log.notes,
  isRx: log.isRx,
  setLogs: log.setLogs.map(mapToSetLog),
  createdAt: log.createdAt,
  updatedAt: log.updatedAt,
});
