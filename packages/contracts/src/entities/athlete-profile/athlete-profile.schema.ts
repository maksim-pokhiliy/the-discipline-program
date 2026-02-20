import { z } from "zod";

import { GENDERS } from "./athlete-profile.constants";

export const athleteProfileSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  gender: z.enum(GENDERS).nullable(),
  heightCm: z.number().int().nullable(),
  weightKg: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateAthleteProfileSchema = z.object({
  gender: z.enum(GENDERS).optional(),
  heightCm: z.number().int().positive().optional(),
  weightKg: z.number().positive().optional(),
});
