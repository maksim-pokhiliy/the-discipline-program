import { z } from "zod";

import { ATHLETE_PROFILE_CONSTANTS, Gender, HealthStatus } from "./athlete-profile.constants";

export const healthStatusSchema = z.nativeEnum(HealthStatus);

export const athleteProfileSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  gender: z.nativeEnum(Gender).nullable(),
  heightCm: z.number().int().positive().max(ATHLETE_PROFILE_CONSTANTS.MAX_HEIGHT_CM).nullable(),
  weightKg: z.number().finite().positive().max(ATHLETE_PROFILE_CONSTANTS.MAX_WEIGHT_KG).nullable(),
  healthStatus: healthStatusSchema,
  healthNote: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateAthleteProfileSchema = z.object({
  gender: z.nativeEnum(Gender).optional(),
  heightCm: z.number().int().positive().max(ATHLETE_PROFILE_CONSTANTS.MAX_HEIGHT_CM).optional(),
  weightKg: z.number().finite().positive().max(ATHLETE_PROFILE_CONSTANTS.MAX_WEIGHT_KG).optional(),
  healthStatus: healthStatusSchema.optional(),
  healthNote: z
    .string()
    .max(ATHLETE_PROFILE_CONSTANTS.MAX_HEALTH_NOTE_LENGTH)
    .nullable()
    .optional(),
});
