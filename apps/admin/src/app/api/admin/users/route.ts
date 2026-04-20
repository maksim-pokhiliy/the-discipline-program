import { createAuthPostHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { iamUserAdminApi } from "@repo/api-server/iam";
import { createUserRequestSchema, createUserResponseSchema } from "@repo/contracts/iam/user";

import { withAdminAuth } from "@app/lib/server/auth";

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (actorId, data) => iamUserAdminApi.createUser(actorId, data),
      createUserRequestSchema,
      createUserResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
