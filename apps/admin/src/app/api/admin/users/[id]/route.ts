import { createGetByIdHandler, createPutHandler } from "@repo/api-routes";
import { iamUserAdminApi } from "@repo/api-server/iam";
import {
  getAdminUserResponseSchema,
  getUserByIdParamsSchema,
  updateUserRoleParamsSchema,
  updateUserRoleRequestSchema,
} from "@repo/contracts/iam/user";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetByIdHandler(
    iamUserAdminApi.getById,
    getUserByIdParamsSchema,
    getAdminUserResponseSchema,
  ),
);
export const PUT = withAdminAuth(
  createPutHandler(
    iamUserAdminApi.updateRole,
    updateUserRoleParamsSchema,
    updateUserRoleRequestSchema,
  ),
);
