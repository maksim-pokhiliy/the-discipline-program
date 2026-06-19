import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsBenchmarkResultApi } from "@repo/api-server/lms";
import {
  benchmarkResultParamsSchema,
  createBenchmarkResultRequestSchema,
  createBenchmarkResultResponseSchema,
} from "@repo/contracts/lms/benchmark-result";

import { withAthleteAuth } from "@app/lib/server/auth";

export const POST = withAthleteAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { sessionId }, data) =>
        lmsBenchmarkResultApi.logBenchmarkResult(userId, sessionId, data),
      benchmarkResultParamsSchema,
      createBenchmarkResultRequestSchema,
      createBenchmarkResultResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
