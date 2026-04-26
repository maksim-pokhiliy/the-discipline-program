import {
  createAuthGetWithQueryHandler,
  createAuthPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsSchemeTemplateApi } from "@repo/api-server/lms/scheme-template";
import {
  createSchemeTemplateInputSchema,
  createSchemeTemplateResponseSchema,
  listSchemeTemplatesQuerySchema,
  listSchemeTemplatesResponseSchema,
} from "@repo/contracts/lms/scheme-template";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      lmsSchemeTemplateApi.list,
      listSchemeTemplatesQuerySchema,
      listSchemeTemplatesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      lmsSchemeTemplateApi.create,
      createSchemeTemplateInputSchema,
      createSchemeTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
