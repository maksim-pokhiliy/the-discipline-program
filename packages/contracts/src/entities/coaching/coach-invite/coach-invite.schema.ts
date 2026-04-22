import { z } from "zod";

export const createCoachInviteSchema = z.object({
  email: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.string().email().max(320)),
  name: z.string().min(1).max(120).nullable().default(null),
});
