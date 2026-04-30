import {
  createAuthGetWithQueryHandler,
  createAuthPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsBlockTemplateApi } from "@repo/api-server/lms/block-template";
import {
  createBlockTemplateInputSchema,
  createBlockTemplateResponseSchema,
  listBlockTemplatesQuerySchema,
  listBlockTemplatesResponseSchema,
} from "@repo/contracts/lms/block-template";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      lmsBlockTemplateApi.list,
      listBlockTemplatesQuerySchema,
      listBlockTemplatesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      lmsBlockTemplateApi.create,
      createBlockTemplateInputSchema,
      createBlockTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
