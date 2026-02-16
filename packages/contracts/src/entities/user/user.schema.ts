import { z } from "zod";

import { athleteProfileSchema } from "../athlete-profile";
import { userRoleSchema } from "../auth";
import { coachProfileSchema } from "../coach-profile";

export const adminUserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  role: userRoleSchema,
  image: z.string().nullable(),
  emailVerified: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  athleteProfile: athleteProfileSchema.nullable(),
  coachProfile: coachProfileSchema.nullable(),
});

export const adminUserListItemSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  role: userRoleSchema,
  image: z.string().nullable(),
  createdAt: z.date(),
});

export const updateUserRoleSchema = z.object({
  role: userRoleSchema,
});
