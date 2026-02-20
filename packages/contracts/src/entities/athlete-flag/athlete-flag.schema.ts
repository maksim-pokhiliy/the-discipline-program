import { z } from "zod";

import { FLAG_TYPES } from "./athlete-flag.constants";

export const flagTypeSchema = z.enum(FLAG_TYPES);

export const athleteFlagSchema = z.object({
  id: z.string().cuid(),
  coachId: z.string().cuid(),
  athleteId: z.string().cuid(),
  type: flagTypeSchema,
  note: z.string().nullable(),
  resolvedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createAthleteFlagSchema = z.object({
  athleteId: z.string().cuid(),
  type: flagTypeSchema,
  note: z.string().max(2000).optional(),
});

export const updateAthleteFlagSchema = z.object({
  note: z.string().max(2000).nullable().optional(),
  resolvedAt: z.coerce.date().nullable().optional(),
});
