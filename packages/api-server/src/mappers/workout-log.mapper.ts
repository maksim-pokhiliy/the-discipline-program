import {
  type BlockScore as PrismaBlockScore,
  type SetLog as PrismaSetLog,
  type WorkoutLog as PrismaWorkoutLog,
} from "@prisma/client";

import { type BlockScore, type SetLog, type WorkoutLog } from "@repo/contracts/workout-log";

import { SCORE_TYPE_MAP } from "./enum-maps";

export const mapToSetLog = (s: PrismaSetLog): SetLog => ({
  id: s.id,
  workoutLogId: s.workoutLogId,
  prescribedSetId: s.prescribedSetId,
  substitutionExerciseId: s.substitutionExerciseId,
  repsDone: s.repsDone,
  weightDone: s.weightDone ? Number(s.weightDone) : null,
  rpeActual: s.rpeActual,
});

export const mapToBlockScore = (bs: PrismaBlockScore): BlockScore => ({
  id: bs.id,
  workoutLogId: bs.workoutLogId,
  blockId: bs.blockId,
  scoreType: SCORE_TYPE_MAP[bs.scoreType],
  scoreValue: bs.scoreValue ? Number(bs.scoreValue) : null,
  scoreRounds: bs.scoreRounds,
  scoreReps: bs.scoreReps,
  scoreTimeSec: bs.scoreTimeSec,
  notes: bs.notes,
});

type PrismaWorkoutLogWithRelations = PrismaWorkoutLog & {
  setLogs: PrismaSetLog[];
  blockScores: PrismaBlockScore[];
};

export const mapToWorkoutLog = (log: PrismaWorkoutLogWithRelations): WorkoutLog => ({
  id: log.id,
  userId: log.userId,
  workoutId: log.workoutId,
  date: log.date,
  notes: log.notes,
  isRx: log.isRx,
  setLogs: log.setLogs.map(mapToSetLog),
  blockScores: log.blockScores.map(mapToBlockScore),
  createdAt: log.createdAt,
  updatedAt: log.updatedAt,
});
