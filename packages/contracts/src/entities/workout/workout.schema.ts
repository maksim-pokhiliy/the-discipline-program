import { z } from "zod";

import { WeightType, WeightUnit } from "../prescribed-set/prescribed-set.constants";
import { ScoreType, SectionType } from "../workout-block/workout-block.constants";

export const workoutPreviewExerciseSchema = z.object({
  name: z.string(),
  reps: z.number().int().positive().nullable(),
  weightValue: z.number().nullable(),
  weightUnit: z.nativeEnum(WeightUnit),
  weightType: z.nativeEnum(WeightType),
  rpe: z.number().int().min(1).max(10).nullable(),
});

export const workoutPreviewBlockSchema = z.object({
  id: z.string().cuid(),
  sectionType: z.nativeEnum(SectionType),
  scoreType: z.nativeEnum(ScoreType),
  title: z.string().nullable(),
  categoryName: z.string().nullable(),
  notes: z.string().nullable(),
  rounds: z.number().int().positive().nullable(),
  timeCapSec: z.number().int().positive().nullable(),
  intervalSec: z.number().int().positive().nullable(),
  workSec: z.number().int().positive().nullable(),
  restSec: z.number().int().positive().nullable(),
  restAfterSec: z.number().int().positive().nullable(),
  exercises: z.array(workoutPreviewExerciseSchema),
});

export const workoutPreviewSchema = z.object({
  blocks: z.array(workoutPreviewBlockSchema),
});

export const workoutSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  scheduledDate: z.date().nullable(),
  title: z.string().max(200),
  description: z.string().nullable(),
  blockCount: z.number().int().nonnegative(),
  sortOrder: z.number().int(),
  isArchived: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createWorkoutSchema = z.object({
  scheduledDate: z.coerce.date().optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
});

export const updateWorkoutSchema = z.object({
  scheduledDate: z.coerce.date().nullable().optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  isArchived: z.boolean().optional(),
});
