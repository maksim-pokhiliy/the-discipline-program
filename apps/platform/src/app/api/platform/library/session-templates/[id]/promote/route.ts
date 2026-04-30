import { createAuthActionHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSessionTemplateApi } from "@repo/api-server/lms/session-template";
import { idParamSchema } from "@repo/contracts/common";
import { promoteSessionTemplateResponseSchema } from "@repo/contracts/lms/session-template";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthActionHandler(
      (actorId, { id }) => lmsSessionTemplateApi.promote(actorId, id),
      idParamSchema,
      promoteSessionTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
