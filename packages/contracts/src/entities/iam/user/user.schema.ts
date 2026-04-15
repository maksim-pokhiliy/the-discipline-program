import { z } from "zod";

import { imageUrlSchema } from "../../../common/image";
import { timezoneSchema } from "../../../common/timezone";
import { userRoleSchema } from "../auth";

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
