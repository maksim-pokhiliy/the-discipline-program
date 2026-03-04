import { z } from "zod";

import { Gender, HealthStatus } from "./athlete-profile.constants";

export const healthStatusSchema = z.nativeEnum(HealthStatus);

export const athleteProfileSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  gender: z.nativeEnum(Gender).nullable(),
  heightCm: z.number().int().nullable(),
  weightKg: z.number().nullable(),
  healthStatus: healthStatusSchema,
  healthNote: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateAthleteProfileSchema = z.object({
  gender: z.nativeEnum(Gender).optional(),
  heightCm: z.number().int().positive().optional(),
  weightKg: z.number().positive().optional(),
  healthStatus: healthStatusSchema.optional(),
  healthNote: z.string().max(2000).nullable().optional(),
});
