import {
  createAuthDeleteHandler,
  createAuthPutByParamHandler,
  createGetByIdHandler,
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
  deleteUserParamsSchema,
  updateUserParamsSchema,
  updateUserRequestSchema,
  updateUserResponseSchema,
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
    createAuthPutByParamHandler(
      (actorId, { id }, data) => iamUserAdminApi.updateUser(actorId, id, data),
      updateUserParamsSchema,
      updateUserRequestSchema,
      updateUserResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (actorId, { id }) => iamUserAdminApi.deleteUser(actorId, id),
      deleteUserParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
