import { createGetByIdHandler, createPutHandler } from "@repo/api-routes";
import { coachingAdminUserViewApi } from "@repo/api-server/coaching";
import { iamUserAdminApi } from "@repo/api-server/iam";
import {
  getAdminUserViewParamsSchema,
  getAdminUserViewResponseSchema,
} from "@repo/contracts/coaching/admin-user-view";
import { updateUserRoleParamsSchema, updateUserRoleRequestSchema } from "@repo/contracts/iam/user";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetByIdHandler(
    coachingAdminUserViewApi.getById,
    getAdminUserViewParamsSchema,
    getAdminUserViewResponseSchema,
  ),
);
export const PUT = withAdminAuth(
  createPutHandler(
    iamUserAdminApi.updateRole,
    updateUserRoleParamsSchema,
    updateUserRoleRequestSchema,
  ),
);
