import { z } from "zod";

import { imageUrlSchema } from "../../../common/image";
import { timezoneSchema } from "../../../common/timezone";
import { UserRole, userRoleSchema } from "../auth";

export const userSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: userRoleSchema,
  image: imageUrlSchema,
  timezone: timezoneSchema,
  emailVerified: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const adminUserListItemSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: userRoleSchema,
  image: imageUrlSchema,
  timezone: timezoneSchema,
  createdAt: z.date(),
  hasPassword: z.boolean(),
});

export const userSearchResultSchema = z.object({
  id: z.string().cuid(),
  name: z.string().nullable(),
  email: z.string().email(),
  image: imageUrlSchema,
});

export const updateUserRoleSchema = z.object({
  role: userRoleSchema,
});

export const createUserSchema = z.object({
  email: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.string().email().max(320)),
  name: z.string().min(1).max(120).nullable().default(null),
  role: z.enum([UserRole.ATHLETE, UserRole.COACH]),
  timezone: timezoneSchema.default("UTC"),
  coachIds: z.array(z.string().cuid()).default([]),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(120).nullable().optional(),
  role: userRoleSchema.optional(),
  timezone: timezoneSchema.optional(),
  coachIds: z.array(z.string().cuid()).optional(),
});
