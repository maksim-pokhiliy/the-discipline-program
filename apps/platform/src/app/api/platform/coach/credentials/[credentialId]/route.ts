import {
  createAuthDeleteHandler,
  createAuthPutByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { coachingCoachCredentialApi } from "@repo/api-server/coaching";
import {
  deleteCoachCredentialParamsSchema,
  updateCoachCredentialParamsSchema,
  updateCoachCredentialRequestSchema,
  updateCoachCredentialResponseSchema,
} from "@repo/contracts/coaching/coach-credential";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { credentialId }, data) =>
        coachingCoachCredentialApi.update(userId, credentialId, data),
      updateCoachCredentialParamsSchema,
      updateCoachCredentialRequestSchema,
      updateCoachCredentialResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { credentialId }) => coachingCoachCredentialApi.delete(userId, credentialId),
      deleteCoachCredentialParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
