import { type z } from "zod";

import {
  type getUsersPageDataResponseSchema,
  type getUsersResponseSchema,
  type searchUsersQuerySchema,
  type searchUsersResponseSchema,
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
