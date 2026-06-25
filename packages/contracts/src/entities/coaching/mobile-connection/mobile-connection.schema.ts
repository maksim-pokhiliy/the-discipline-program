import { z } from "zod";

export const mobileConnectionSchema = z.object({
  id: z.string().cuid(),
  legacyUserId: z.string(),
  legacyUserName: z.string(),
  legacyUserRole: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const connectMobileSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
