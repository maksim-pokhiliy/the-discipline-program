import { z } from "zod";

import { UNITS } from "./prescribed-set.constants";

export const prescribedSetSchema = z.object({
  id: z.string().cuid(),
  blockId: z.string().cuid(),
  exerciseId: z.string().cuid(),
  sets: z.number().int().positive().nullable(),
  reps: z.number().int().positive().nullable(),
  weightValue: z.number().nullable(),
  weightUnit: z.enum(UNITS),
  rpe: z.number().int().min(1).max(10).nullable(),
  notes: z.string().nullable(),
});

export const createPrescribedSetSchema = z.object({
  exerciseId: z.string().cuid(),
  sets: z.number().int().positive().optional(),
  reps: z.number().int().positive().optional(),
  weightValue: z.number().positive().optional(),
  weightUnit: z.enum(UNITS).optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(500).optional(),
});

export const updatePrescribedSetSchema = z.object({
  exerciseId: z.string().cuid().optional(),
  sets: z.number().int().positive().nullable().optional(),
  reps: z.number().int().positive().nullable().optional(),
  weightValue: z.number().positive().nullable().optional(),
  weightUnit: z.enum(UNITS).optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});
