import { createAuthPostByParamHandler, withAuthRateLimit, RATE_LIMIT_TIER } from "@repo/api-routes";
import { lmsPerformedSchemaResultApi } from "@repo/api-server/lms";
import {
  createPerformedSchemaResultRequestSchema,
  createPerformedSchemaResultResponseSchema,
  performedSchemaResultParamsSchema,
} from "@repo/contracts/lms/performed-schema-result";

import { withAthleteAuth } from "@app/lib/server/auth";

export const POST = withAthleteAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { performedSessionId }, data) =>
        lmsPerformedSchemaResultApi.create(userId, performedSessionId, data),
      performedSchemaResultParamsSchema,
      createPerformedSchemaResultRequestSchema,
      createPerformedSchemaResultResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
