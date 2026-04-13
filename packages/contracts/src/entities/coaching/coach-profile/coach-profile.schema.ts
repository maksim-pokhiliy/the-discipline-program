import { z } from "zod";

import { COACH_PROFILE_CONSTANTS } from "./coach-profile.constants";

export const coachProfileSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  bio: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateCoachProfileSchema = z.object({
  bio: z.string().max(COACH_PROFILE_CONSTANTS.MAX_BIO_LENGTH).optional(),
});
