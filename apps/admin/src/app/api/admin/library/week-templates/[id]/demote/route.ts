import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsWeekTemplateApi } from "@repo/api-server/lms/week-template";
import { idParamSchema } from "@repo/contracts/common";
import {
  demoteWeekTemplateInputSchema,
  demoteWeekTemplateResponseSchema,
} from "@repo/contracts/lms/week-template";

import { withAdminAuth } from "@app/lib/server/auth";

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (actorId, { id }, data) => lmsWeekTemplateApi.demote(actorId, id, data),
      idParamSchema,
      demoteWeekTemplateInputSchema,
      demoteWeekTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
