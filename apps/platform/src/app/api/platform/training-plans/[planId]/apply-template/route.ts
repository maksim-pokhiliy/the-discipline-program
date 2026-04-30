import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { applyTemplate } from "@repo/api-server/lms";
import {
  applyTemplateInputSchema,
  applyTemplateParamsSchema,
  applyTemplateResponseSchema,
} from "@repo/contracts/lms/training-plan";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId }, data) => applyTemplate(userId, planId, data),
      applyTemplateParamsSchema,
      applyTemplateInputSchema,
      applyTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
