import { createAuthDeleteHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { mobilePublishApi } from "@repo/api-server/coaching";
import { deleteMobileLinkParamsSchema } from "@repo/contracts/coaching/mobile-link";

import { withCoachAuth } from "@app/lib/server/auth";

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { linkId }) => mobilePublishApi.deleteLink(userId, linkId),
      deleteMobileLinkParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
