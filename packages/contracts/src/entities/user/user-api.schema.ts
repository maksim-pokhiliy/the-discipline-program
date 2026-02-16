import { z } from "zod";

import { adminUserListItemSchema, adminUserSchema, updateUserRoleSchema } from "./user.schema";

export const getUsersResponseSchema = z.array(adminUserListItemSchema);

export const getUserByIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const getAdminUserResponseSchema = adminUserSchema;

export const updateUserRoleParamsSchema = z.object({
  id: z.string().cuid(),
});

export const updateUserRoleRequestSchema = updateUserRoleSchema;

export const getUserStatsResponseSchema = z.object({
  total: z.number(),
  newThisMonth: z.number(),
  byRole: z.object({
    user: z.number(),
    coach: z.number(),
    admin: z.number(),
  }),
});

export const getUsersPageDataResponseSchema = z.object({
  stats: getUserStatsResponseSchema,
  users: getUsersResponseSchema,
});
