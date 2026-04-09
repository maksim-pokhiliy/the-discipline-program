import { type z } from "zod";

import {
  type getAdminUserResponseSchema,
  type getUserByIdParamsSchema,
  type getUsersPageDataResponseSchema,
  type getUsersResponseSchema,
  type searchUsersQuerySchema,
  type searchUsersResponseSchema,
  type updateUserRoleParamsSchema,
  type updateUserRoleRequestSchema,
} from "./user-api.schema";

export type GetUsersResponse = z.infer<typeof getUsersResponseSchema>;
export type GetUserByIdParams = z.infer<typeof getUserByIdParamsSchema>;
export type GetAdminUserResponse = z.infer<typeof getAdminUserResponseSchema>;
export type UpdateUserRoleParams = z.infer<typeof updateUserRoleParamsSchema>;
export type UpdateUserRoleRequest = z.infer<typeof updateUserRoleRequestSchema>;
export type GetUsersPageDataResponse = z.infer<typeof getUsersPageDataResponseSchema>;
export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;
export type SearchUsersResponse = z.infer<typeof searchUsersResponseSchema>;
