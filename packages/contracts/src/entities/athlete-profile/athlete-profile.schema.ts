import { z } from "zod";

import { GENDERS } from "./athlete-profile.constants";

export const athleteProfileSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  name: z.string().nullable(),
  gender: z.enum(GENDERS).nullable(),
  heightCm: z.number().int().nullable(),
  weightKg: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateAthleteProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  gender: z.enum(GENDERS).optional(),
  heightCm: z.number().int().positive().optional(),
  weightKg: z.number().positive().optional(),
});
