import { adminUsersApi } from "@repo/api-server";
import {
  getAdminUserResponseSchema,
  getUserByIdParamsSchema,
  updateUserRoleParamsSchema,
  updateUserRoleRequestSchema,
} from "@repo/contracts/user";

import { createGetByIdHandler, createPutHandler } from "@app/lib/route-helpers";

export const GET = createGetByIdHandler(
  adminUsersApi.getById,
  getUserByIdParamsSchema,
  getAdminUserResponseSchema,
);
export const PUT = createPutHandler(
  adminUsersApi.updateRole,
  updateUserRoleParamsSchema,
  updateUserRoleRequestSchema,
);
