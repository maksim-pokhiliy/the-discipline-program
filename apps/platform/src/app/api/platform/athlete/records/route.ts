import { createAuthGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsRecordsViewApi } from "@repo/api-server/lms";
import { recordsViewResponseSchema } from "@repo/contracts/lms/records-view";

import { withAthleteAuth } from "@app/lib/server/auth";

export const GET = withAthleteAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => lmsRecordsViewApi.getRecords(userId),
      recordsViewResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
