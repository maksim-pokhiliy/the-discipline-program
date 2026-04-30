import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsBlockKindApi } from "@repo/api-server/lms/block-kind";
import { idParamSchema } from "@repo/contracts/common";
import {
  demoteBlockKindInputSchema,
  demoteBlockKindResponseSchema,
} from "@repo/contracts/lms/block-kind";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (actorId, { id }, data) => lmsBlockKindApi.demote(actorId, id, data),
      idParamSchema,
      demoteBlockKindInputSchema,
      demoteBlockKindResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
