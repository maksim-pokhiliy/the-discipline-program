import { z } from "zod";

import { idParamSchema } from "../../../common";

import {
  adminUserListItemSchema,
  updateUserRoleSchema,
  userSchema,
  userSearchResultSchema,
} from "./user.schema";

export const getUsersResponseSchema = z.array(adminUserListItemSchema);

export const updateUserRoleParamsSchema = idParamSchema;

export const updateUserRoleRequestSchema = updateUserRoleSchema;

export const updateUserRoleResponseSchema = userSchema;

export const getUsersPageDataResponseSchema = z.object({
  users: getUsersResponseSchema,
});

export const searchUsersQuerySchema = z.object({
  q: z.string().default(""),
});

export const searchUsersResponseSchema = z.array(userSearchResultSchema);
