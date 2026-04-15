import {
  createAuthGetByParamHandler,
  createAuthPostByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsUserBenchmarkApi } from "@repo/api-server/lms";
import {
  createUserBenchmarkRequestSchema,
  createUserBenchmarkResponseSchema,
  getUserBenchmarksParamsSchema,
  getUserBenchmarksResponseSchema,
} from "@repo/contracts/lms/user-benchmark";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (authUserId, { userId }) => lmsUserBenchmarkApi.getByUser(authUserId, userId),
      getUserBenchmarksParamsSchema,
      getUserBenchmarksResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withPlatformAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (authUserId, { userId }, data) => lmsUserBenchmarkApi.create(authUserId, userId, data),
      getUserBenchmarksParamsSchema,
      createUserBenchmarkRequestSchema,
      createUserBenchmarkResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
