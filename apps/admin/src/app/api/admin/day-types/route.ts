import {
  createGetHandler,
  createPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsDayTypeAdminApi } from "@repo/api-server/lms";
import {
  createDayTypeRequestSchema,
  createDayTypeResponseSchema,
  getDayTypesResponseSchema,
} from "@repo/contracts/lms/day-type";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(lmsDayTypeAdminApi.getDayTypes, getDayTypesResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
export const POST = withAdminAuth(
  withAuthRateLimit(
    createPostHandler(
      lmsDayTypeAdminApi.createDayType,
      createDayTypeRequestSchema,
      createDayTypeResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
