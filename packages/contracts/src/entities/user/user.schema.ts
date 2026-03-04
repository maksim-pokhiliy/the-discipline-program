import { z } from "zod";

import { athleteProfileSchema } from "../athlete-profile";
import { userRoleSchema } from "../auth";
import { coachProfileSchema } from "../coach-profile";

export const timezoneSchema = z.string().refine(
  (tz) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });

      return true;
    } catch {
      return false;
    }
  },
  { message: "Invalid IANA timezone" },
);

export const adminUserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: userRoleSchema,
  image: z.string().nullable(),
  timezone: z.string(),
  emailVerified: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  athleteProfile: athleteProfileSchema.nullable(),
  coachProfile: coachProfileSchema.nullable(),
});

export const adminUserListItemSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: userRoleSchema,
  image: z.string().nullable(),
  timezone: z.string(),
  createdAt: z.date(),
});

export const updateUserRoleSchema = z.object({
  role: userRoleSchema,
});
