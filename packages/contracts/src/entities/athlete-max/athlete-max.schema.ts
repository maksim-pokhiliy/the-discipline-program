import { z } from "zod";

import { WeightUnit } from "../prescribed-set/prescribed-set.constants";

export const athleteMaxSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  exerciseId: z.string().cuid(),
  value: z.number().positive(),
  unit: z.nativeEnum(WeightUnit),
  testedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export const createAthleteMaxSchema = z.object({
  userId: z.string().cuid(),
  exerciseId: z.string().cuid(),
  value: z.number().positive(),
  unit: z.nativeEnum(WeightUnit).optional(),
  testedAt: z.coerce.date().optional(),
});

export const updateAthleteMaxSchema = z.object({
  value: z.number().positive().optional(),
  unit: z.nativeEnum(WeightUnit).optional(),
  testedAt: z.coerce.date().optional(),
});
