import { z } from "zod";

export const coachListItemSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  name: z.string().nullable(),
  email: z.string().email(),
});
