import { createAuthActionHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { iamUserAdminApi } from "@repo/api-server/iam";
import {
  resendInviteParamsSchema,
  resendInviteResponseSchema,
} from "@repo/contracts/iam/invite-token";

import { withAdminAuth } from "@app/lib/server/auth";

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthActionHandler(
      (actorId, { id }) => iamUserAdminApi.resendInvite(actorId, id),
      resendInviteParamsSchema,
      resendInviteResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
