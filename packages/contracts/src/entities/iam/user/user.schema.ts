import { z } from "zod";

import { userRoleSchema } from "../auth";

export const userSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: userRoleSchema,
  image: z.string().nullable(),
  timezone: z.string(),
  emailVerified: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
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

export const userSearchResultSchema = z.object({
  id: z.string().cuid(),
  name: z.string().nullable(),
  email: z.string().email(),
  image: z.string().nullable(),
});

export const updateUserRoleSchema = z.object({
  role: userRoleSchema,
});
