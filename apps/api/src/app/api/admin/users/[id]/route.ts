import { adminUsersApi } from "@repo/api-server";
import {
  getAdminUserResponseSchema,
  getUserByIdParamsSchema,
  updateUserRoleParamsSchema,
  updateUserRoleRequestSchema,
} from "@repo/contracts/user";

import { withAdminAuth } from "@app/lib/auth";
import { createGetByIdHandler, createPutHandler } from "@app/lib/route-helpers";

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
