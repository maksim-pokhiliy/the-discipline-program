import { z } from "zod";

export const coachProfileSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  bio: z.string().nullable(),
});
