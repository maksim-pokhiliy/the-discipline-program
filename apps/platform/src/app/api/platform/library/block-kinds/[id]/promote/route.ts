import { createAuthActionHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsBlockKindApi } from "@repo/api-server/lms/block-kind";
import { idParamSchema } from "@repo/contracts/common";
import { promoteBlockKindResponseSchema } from "@repo/contracts/lms/block-kind";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthActionHandler(
      (actorId, { id }) => lmsBlockKindApi.promote(actorId, id),
      idParamSchema,
      promoteBlockKindResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
