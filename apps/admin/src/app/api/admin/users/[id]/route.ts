import { createGetByIdHandler, createPutHandler } from "@repo/api-routes";
import { adminUsersApi } from "@repo/api-server";
import {
  getAdminUserResponseSchema,
  getUserByIdParamsSchema,
  updateUserRoleParamsSchema,
  updateUserRoleRequestSchema,
} from "@repo/contracts/user";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetByIdHandler(adminUsersApi.getById, getUserByIdParamsSchema, getAdminUserResponseSchema),
);
export const PUT = withAdminAuth(
  createPutHandler(
    adminUsersApi.updateRole,
    updateUserRoleParamsSchema,
    updateUserRoleRequestSchema,
  ),
);
