import { createAuthGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { iamAdminCoachListApi } from "@repo/api-server/iam";
import { getCoachesListResponseSchema } from "@repo/contracts/iam/user";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(() => iamAdminCoachListApi.getAll(), getCoachesListResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
