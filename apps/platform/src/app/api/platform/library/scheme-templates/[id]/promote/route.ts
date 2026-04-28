import { createAuthActionHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSchemeTemplateApi } from "@repo/api-server/lms/scheme-template";
import { idParamSchema } from "@repo/contracts/common";
import { promoteSchemeTemplateResponseSchema } from "@repo/contracts/lms/scheme-template";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthActionHandler(
      (actorId, { id }) => lmsSchemeTemplateApi.promote(actorId, id),
      idParamSchema,
      promoteSchemeTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
