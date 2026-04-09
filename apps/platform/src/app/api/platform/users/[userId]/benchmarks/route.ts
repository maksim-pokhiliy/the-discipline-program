import { createAuthGetByParamHandler, createAuthPostByParamHandler } from "@repo/api-routes";
import { platformUserBenchmarksApi } from "@repo/api-server";
import {
  createUserBenchmarkRequestSchema,
  createUserBenchmarkResponseSchema,
  getUserBenchmarksParamsSchema,
  getUserBenchmarksResponseSchema,
} from "@repo/contracts/user-benchmark";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetByParamHandler(
    (authUserId, { userId }) => platformUserBenchmarksApi.getByUser(authUserId, userId),
    getUserBenchmarksParamsSchema,
    getUserBenchmarksResponseSchema,
  ),
);

export const POST = withPlatformAuth(
  createAuthPostByParamHandler(
    (authUserId, { userId }, data) => platformUserBenchmarksApi.create(authUserId, userId, data),
    getUserBenchmarksParamsSchema,
    createUserBenchmarkRequestSchema,
    createUserBenchmarkResponseSchema,
  ),
);
