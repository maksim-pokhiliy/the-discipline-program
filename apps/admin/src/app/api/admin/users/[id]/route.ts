import {
  createGetByIdHandler,
  createPutHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { coachingAdminUserViewApi } from "@repo/api-server/coaching";
import { iamUserAdminApi } from "@repo/api-server/iam";
import {
  getAdminUserViewParamsSchema,
  getAdminUserViewResponseSchema,
} from "@repo/contracts/coaching/admin-user-view";
import {
  updateUserRoleParamsSchema,
  updateUserRoleRequestSchema,
  updateUserRoleResponseSchema,
} from "@repo/contracts/iam/user";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetByIdHandler(
      coachingAdminUserViewApi.getById,
      getAdminUserViewParamsSchema,
      getAdminUserViewResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const PUT = withAdminAuth(
  withAuthRateLimit(
    createPutHandler(
      iamUserAdminApi.updateRole,
      updateUserRoleParamsSchema,
      updateUserRoleRequestSchema,
      updateUserRoleResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
