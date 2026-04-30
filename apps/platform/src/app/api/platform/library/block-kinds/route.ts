import {
  createAuthGetWithQueryHandler,
  createAuthPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsBlockKindApi } from "@repo/api-server/lms/block-kind";
import {
  createBlockKindInputSchema,
  createBlockKindResponseSchema,
  listBlockKindsQuerySchema,
  listBlockKindsResponseSchema,
} from "@repo/contracts/lms/block-kind";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      lmsBlockKindApi.list,
      listBlockKindsQuerySchema,
      listBlockKindsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      lmsBlockKindApi.create,
      createBlockKindInputSchema,
      createBlockKindResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
