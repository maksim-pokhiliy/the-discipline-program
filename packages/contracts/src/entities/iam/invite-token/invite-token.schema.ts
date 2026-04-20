import { z } from "zod";

export const inviteTokenSchema = z.object({
  email: z.string().email(),
  recipientName: z.string().nullable(),
  expiresAt: z.date(),
});
