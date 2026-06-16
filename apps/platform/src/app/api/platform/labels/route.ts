import { createAuthPostHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsLabelPlatformApi } from "@repo/api-server/lms";
import { createLabelRequestSchema, labelSchema } from "@repo/contracts/lms/label";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => lmsLabelPlatformApi.create(userId, data),
      createLabelRequestSchema,
      labelSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
