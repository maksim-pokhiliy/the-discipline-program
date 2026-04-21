import { z } from "zod";

import { idParamSchema } from "../../../common";

import { coachListItemSchema } from "./coach-list.schema";
import {
  adminUserListItemSchema,
  createUserSchema,
  updateUserRoleSchema,
  updateUserSchema,
  userSchema,
  userSearchResultSchema,
} from "./user.schema";

export const getUsersResponseSchema = z.array(adminUserListItemSchema);

export const getCoachesListResponseSchema = z.array(coachListItemSchema);

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

export const createUserRequestSchema = createUserSchema;

export const createUserResponseSchema = userSchema;

export const updateUserParamsSchema = idParamSchema;

export const updateUserRequestSchema = updateUserSchema;

export const updateUserResponseSchema = userSchema;

export const deleteUserParamsSchema = idParamSchema;
