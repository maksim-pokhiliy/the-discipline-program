import {
  createAuthGetWithQueryHandler,
  createAuthPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsWeekTemplateApi } from "@repo/api-server/lms/week-template";
import {
  createWeekTemplateInputSchema,
  createWeekTemplateResponseSchema,
  listWeekTemplatesQuerySchema,
  listWeekTemplatesResponseSchema,
} from "@repo/contracts/lms/week-template";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      lmsWeekTemplateApi.list,
      listWeekTemplatesQuerySchema,
      listWeekTemplatesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      lmsWeekTemplateApi.create,
      createWeekTemplateInputSchema,
      createWeekTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
