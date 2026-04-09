import { z } from "zod";

import { idParamSchema } from "../../common";

import {
  adminUserListItemSchema,
  adminUserSchema,
  updateUserRoleSchema,
  userSearchResultSchema,
} from "./user.schema";

export const getUsersResponseSchema = z.array(adminUserListItemSchema);

export const getUserByIdParamsSchema = idParamSchema;

export const getAdminUserResponseSchema = adminUserSchema;

export const updateUserRoleParamsSchema = idParamSchema;

export const updateUserRoleRequestSchema = updateUserRoleSchema;

export const getUsersPageDataResponseSchema = z.object({
  users: getUsersResponseSchema,
});

export const searchUsersQuerySchema = z.object({
  q: z.string().default(""),
});

export const searchUsersResponseSchema = z.array(userSearchResultSchema);
