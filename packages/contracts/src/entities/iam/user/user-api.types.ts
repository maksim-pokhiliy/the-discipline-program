import { type z } from "zod";

import {
  type createUserRequestSchema,
  type createUserResponseSchema,
  type deleteUserParamsSchema,
  type getUsersPageDataResponseSchema,
  type getUsersResponseSchema,
  type searchUsersQuerySchema,
  type searchUsersResponseSchema,
  type updateUserParamsSchema,
  type updateUserRequestSchema,
  type updateUserResponseSchema,
  type updateUserRoleParamsSchema,
  type updateUserRoleRequestSchema,
  type updateUserRoleResponseSchema,
} from "./user-api.schema";

export type GetUsersResponse = z.infer<typeof getUsersResponseSchema>;
export type UpdateUserRoleParams = z.infer<typeof updateUserRoleParamsSchema>;
export type UpdateUserRoleRequest = z.infer<typeof updateUserRoleRequestSchema>;
export type UpdateUserRoleResponse = z.infer<typeof updateUserRoleResponseSchema>;
export type GetUsersPageDataResponse = z.infer<typeof getUsersPageDataResponseSchema>;
export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;
export type SearchUsersResponse = z.infer<typeof searchUsersResponseSchema>;
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type CreateUserResponse = z.infer<typeof createUserResponseSchema>;
export type UpdateUserParams = z.infer<typeof updateUserParamsSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
export type UpdateUserResponse = z.infer<typeof updateUserResponseSchema>;
export type DeleteUserParams = z.infer<typeof deleteUserParamsSchema>;
