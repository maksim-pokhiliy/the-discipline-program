import {
  createAuthGetWithQueryHandler,
  createAuthPostHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsOneRMRecordApi } from "@repo/api-server/lms";
import {
  createOneRMRecordRequestSchema,
  createOneRMRecordResponseSchema,
  getOneRMRecordsQuerySchema,
  getOneRMRecordsResponseSchema,
} from "@repo/contracts/lms/one-rm-record";

import { withAthleteAuth } from "@app/lib/server/auth";

export const GET = withAthleteAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      async (userId, query) => ({
        records: await lmsOneRMRecordApi.listByUser(userId, {
          ...(query.exerciseId !== undefined && { exerciseId: query.exerciseId }),
        }),
      }),
      getOneRMRecordsQuerySchema,
      getOneRMRecordsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withAthleteAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => lmsOneRMRecordApi.create(userId, data),
      createOneRMRecordRequestSchema,
      createOneRMRecordResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
