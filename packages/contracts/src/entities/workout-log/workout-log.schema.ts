import { z } from "zod";

import { ScoreType } from "../workout-block/workout-block.constants";

export const setLogSchema = z.object({
  id: z.string().cuid(),
  workoutLogId: z.string().cuid(),
  prescribedSetId: z.string().cuid().nullable(),
  substitutionExerciseId: z.string().cuid().nullable(),
  repsDone: z.number().int().positive(),
  weightDone: z.number().nullable(),
  rpeActual: z.number().int().min(1).max(10).nullable(),
});

export const blockScoreSchema = z.object({
  id: z.string().cuid(),
  workoutLogId: z.string().cuid(),
  blockId: z.string().cuid(),
  scoreType: z.nativeEnum(ScoreType),
  scoreValue: z.number().nullable(),
  scoreRounds: z.number().int().nullable(),
  scoreReps: z.number().int().nullable(),
  scoreTimeSec: z.number().int().nullable(),
  notes: z.string().nullable(),
});

export const workoutLogSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  workoutId: z.string().cuid(),
  date: z.date(),
  notes: z.string().nullable(),
  isRx: z.boolean(),
  setLogs: z.array(setLogSchema),
  blockScores: z.array(blockScoreSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSetLogSchema = z.object({
  prescribedSetId: z.string().cuid().optional(),
  substitutionExerciseId: z.string().cuid().optional(),
  repsDone: z.number().int().positive(),
  weightDone: z.number().positive().optional(),
  rpeActual: z.number().int().min(1).max(10).optional(),
});

export const createBlockScoreSchema = z.object({
  blockId: z.string().cuid(),
  scoreType: z.nativeEnum(ScoreType),
  scoreValue: z.number().optional(),
  scoreRounds: z.number().int().optional(),
  scoreReps: z.number().int().optional(),
  scoreTimeSec: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
});

export const createWorkoutLogSchema = z.object({
  workoutId: z.string().cuid(),
  date: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
  isRx: z.boolean().optional(),
  setLogs: z.array(createSetLogSchema).min(1),
  blockScores: z.array(createBlockScoreSchema).optional(),
});
