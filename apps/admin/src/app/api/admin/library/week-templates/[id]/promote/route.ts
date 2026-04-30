import { createAuthActionHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsWeekTemplateApi } from "@repo/api-server/lms/week-template";
import { idParamSchema } from "@repo/contracts/common";
import { promoteWeekTemplateResponseSchema } from "@repo/contracts/lms/week-template";

import { withAdminAuth } from "@app/lib/server/auth";

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthActionHandler(
      (actorId, { id }) => lmsWeekTemplateApi.promote(actorId, id),
      idParamSchema,
      promoteWeekTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
