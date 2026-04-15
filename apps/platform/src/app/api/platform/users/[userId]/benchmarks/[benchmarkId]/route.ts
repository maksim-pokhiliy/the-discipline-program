import {
  createAuthDeleteHandler,
  createAuthPutByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsUserBenchmarkApi } from "@repo/api-server/lms";
import {
  deleteUserBenchmarkParamsSchema,
  updateUserBenchmarkParamsSchema,
  updateUserBenchmarkRequestSchema,
  updateUserBenchmarkResponseSchema,
} from "@repo/contracts/lms/user-benchmark";

import { withPlatformAuth } from "@app/lib/server/auth";

export const PUT = withPlatformAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { benchmarkId }, data) => lmsUserBenchmarkApi.update(userId, benchmarkId, data),
      updateUserBenchmarkParamsSchema,
      updateUserBenchmarkRequestSchema,
      updateUserBenchmarkResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withPlatformAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { benchmarkId }) => lmsUserBenchmarkApi.delete(userId, benchmarkId),
      deleteUserBenchmarkParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
