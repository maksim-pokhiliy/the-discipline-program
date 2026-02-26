import { z } from "zod";

import { GENDERS, HEALTH_STATUSES } from "./athlete-profile.constants";

export const healthStatusSchema = z.enum(HEALTH_STATUSES);

export const athleteProfileSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  gender: z.enum(GENDERS).nullable(),
  heightCm: z.number().int().nullable(),
  weightKg: z.number().nullable(),
  healthStatus: healthStatusSchema,
  healthNote: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateAthleteProfileSchema = z.object({
  gender: z.enum(GENDERS).optional(),
  heightCm: z.number().int().positive().optional(),
  weightKg: z.number().positive().optional(),
  healthStatus: healthStatusSchema.optional(),
  healthNote: z.string().max(2000).nullable().optional(),
});
