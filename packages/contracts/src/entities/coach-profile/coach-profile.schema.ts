import { z } from "zod";

export const coachProfileSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  bio: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateCoachProfileSchema = z.object({
  bio: z.string().max(2000).optional(),
});
