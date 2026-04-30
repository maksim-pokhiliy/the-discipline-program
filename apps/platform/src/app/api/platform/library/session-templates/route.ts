import {
  createAuthGetWithQueryHandler,
  createAuthPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsSessionTemplateApi } from "@repo/api-server/lms/session-template";
import {
  createSessionTemplateInputSchema,
  createSessionTemplateResponseSchema,
  listSessionTemplatesQuerySchema,
  listSessionTemplatesResponseSchema,
} from "@repo/contracts/lms/session-template";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      lmsSessionTemplateApi.list,
      listSessionTemplatesQuerySchema,
      listSessionTemplatesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      lmsSessionTemplateApi.create,
      createSessionTemplateInputSchema,
      createSessionTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
