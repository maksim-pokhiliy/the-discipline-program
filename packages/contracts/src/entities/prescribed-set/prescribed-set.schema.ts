import { z } from "zod";

import { WeightType, WeightUnit } from "./prescribed-set.constants";

export const prescribedSetSchema = z.object({
  id: z.string().cuid(),
  blockId: z.string().cuid(),
  exerciseId: z.string().cuid(),
  reps: z.number().int().positive().nullable(),
  weightValue: z.number().nullable(),
  weightUnit: z.nativeEnum(WeightUnit),
  weightType: z.nativeEnum(WeightType),
  rpe: z.number().int().min(1).max(10).nullable(),
  notes: z.string().nullable(),
  sortOrder: z.number().int(),
});

export const createPrescribedSetSchema = z
  .object({
    exerciseId: z.string().cuid(),
    reps: z.number().int().positive().optional(),
    weightValue: z.number().positive().optional(),
    weightUnit: z.nativeEnum(WeightUnit).optional(),
    weightType: z.nativeEnum(WeightType).optional(),
    rpe: z.number().int().min(1).max(10).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => data.reps !== undefined || data.weightValue !== undefined || data.rpe !== undefined,
    { message: "At least one of reps, weightValue, or rpe is required" },
  );

export const updatePrescribedSetSchema = z.object({
  exerciseId: z.string().cuid().optional(),
  reps: z.number().int().positive().nullable().optional(),
  weightValue: z.number().positive().nullable().optional(),
  weightUnit: z.nativeEnum(WeightUnit).optional(),
  weightType: z.nativeEnum(WeightType).optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});
