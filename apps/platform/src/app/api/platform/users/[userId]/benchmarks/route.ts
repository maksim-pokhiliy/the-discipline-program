import { createAuthGetByParamHandler, createAuthPostByParamHandler } from "@repo/api-routes";
import { lmsUserBenchmarkApi } from "@repo/api-server/lms";
import {
  createUserBenchmarkRequestSchema,
  createUserBenchmarkResponseSchema,
  getUserBenchmarksParamsSchema,
  getUserBenchmarksResponseSchema,
} from "@repo/contracts/lms/user-benchmark";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetByParamHandler(
    (authUserId, { userId }) => lmsUserBenchmarkApi.getByUser(authUserId, userId),
    getUserBenchmarksParamsSchema,
    getUserBenchmarksResponseSchema,
  ),
);

export const POST = withPlatformAuth(
  createAuthPostByParamHandler(
    (authUserId, { userId }, data) => lmsUserBenchmarkApi.create(authUserId, userId, data),
    getUserBenchmarksParamsSchema,
    createUserBenchmarkRequestSchema,
    createUserBenchmarkResponseSchema,
  ),
);
