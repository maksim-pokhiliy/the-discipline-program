import { createGetByIdHandler, createPutHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminUsersApi } from "@repo/api-server";
import {
  getAdminUserResponseSchema,
  getUserByIdParamsSchema,
  updateUserRoleParamsSchema,
  updateUserRoleRequestSchema,
} from "@repo/contracts/user";

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
