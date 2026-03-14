import { z } from "zod";

import { exerciseCategorySchema } from "../exercise-category/exercise-category.schema";

import { ScoreType, SectionType } from "./workout-block.constants";

export const workoutBlockSchema = z.object({
  id: z.string().cuid(),
  workoutId: z.string().cuid(),
  categoryId: z.string().cuid().nullable(),
  category: exerciseCategorySchema.nullable(),
  sectionType: z.nativeEnum(SectionType),
  scoreType: z.nativeEnum(ScoreType),
  title: z.string().nullable(),
  notes: z.string().nullable(),
  rounds: z.number().int().positive().nullable(),
  timeCapSec: z.number().int().positive().nullable(),
  intervalSec: z.number().int().positive().nullable(),
  workSec: z.number().int().positive().nullable(),
  restSec: z.number().int().positive().nullable(),
  restAfterSec: z.number().int().positive().nullable(),
  sortOrder: z.number().int(),
});

export const createWorkoutBlockSchema = z.object({
  categoryId: z.string().cuid().optional(),
  sectionType: z.nativeEnum(SectionType).optional(),
  scoreType: z.nativeEnum(ScoreType).optional(),
  title: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  rounds: z.number().int().positive().optional(),
  timeCapSec: z.number().int().positive().optional(),
  intervalSec: z.number().int().positive().optional(),
  workSec: z.number().int().positive().optional(),
  restSec: z.number().int().positive().optional(),
  restAfterSec: z.number().int().positive().optional(),
});

export const updateWorkoutBlockSchema = z.object({
  categoryId: z.string().cuid().nullable().optional(),
  sectionType: z.nativeEnum(SectionType).optional(),
  scoreType: z.nativeEnum(ScoreType).optional(),
  title: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  rounds: z.number().int().positive().nullable().optional(),
  timeCapSec: z.number().int().positive().nullable().optional(),
  intervalSec: z.number().int().positive().nullable().optional(),
  workSec: z.number().int().positive().nullable().optional(),
  restSec: z.number().int().positive().nullable().optional(),
  restAfterSec: z.number().int().positive().nullable().optional(),
});
