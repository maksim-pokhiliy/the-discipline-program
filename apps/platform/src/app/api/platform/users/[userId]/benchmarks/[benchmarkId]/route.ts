import { createAuthDeleteHandler, createAuthPutByParamHandler } from "@repo/api-routes";
import { platformUserBenchmarksApi } from "@repo/api-server";
import {
  deleteUserBenchmarkParamsSchema,
  updateUserBenchmarkParamsSchema,
  updateUserBenchmarkRequestSchema,
  updateUserBenchmarkResponseSchema,
} from "@repo/contracts/user-benchmark";

import { withPlatformAuth } from "@app/lib/server/auth";

export const PUT = withPlatformAuth(
  createAuthPutByParamHandler(
    (userId, { benchmarkId }, data) => platformUserBenchmarksApi.update(userId, benchmarkId, data),
    updateUserBenchmarkParamsSchema,
    updateUserBenchmarkRequestSchema,
    updateUserBenchmarkResponseSchema,
  ),
);

export const DELETE = withPlatformAuth(
  createAuthDeleteHandler(
    (userId, { benchmarkId }) => platformUserBenchmarksApi.delete(userId, benchmarkId),
    deleteUserBenchmarkParamsSchema,
  ),
);
