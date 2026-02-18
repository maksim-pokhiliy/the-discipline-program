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

export const getUsersPageDataResponseSchema = z.object({
  users: getUsersResponseSchema,
});
