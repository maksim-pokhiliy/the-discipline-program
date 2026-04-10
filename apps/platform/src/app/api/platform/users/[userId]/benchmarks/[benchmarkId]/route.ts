import { createAuthDeleteHandler, createAuthPutByParamHandler } from "@repo/api-routes";
import { lmsUserBenchmarkApi } from "@repo/api-server/lms";
import {
  deleteUserBenchmarkParamsSchema,
  updateUserBenchmarkParamsSchema,
  updateUserBenchmarkRequestSchema,
  updateUserBenchmarkResponseSchema,
} from "@repo/contracts/lms/user-benchmark";

import { withPlatformAuth } from "@app/lib/server/auth";

export const PUT = withPlatformAuth(
  createAuthPutByParamHandler(
    (userId, { benchmarkId }, data) => lmsUserBenchmarkApi.update(userId, benchmarkId, data),
    updateUserBenchmarkParamsSchema,
    updateUserBenchmarkRequestSchema,
    updateUserBenchmarkResponseSchema,
  ),
);

export const DELETE = withPlatformAuth(
  createAuthDeleteHandler(
    (userId, { benchmarkId }) => lmsUserBenchmarkApi.delete(userId, benchmarkId),
    deleteUserBenchmarkParamsSchema,
  ),
);
