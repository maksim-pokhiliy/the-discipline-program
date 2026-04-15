import {
  createAuthGetWithQueryHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { iamUserSearchApi } from "@repo/api-server/iam";
import { searchUsersQuerySchema, searchUsersResponseSchema } from "@repo/contracts/iam/user";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      (userId, { q }) => iamUserSearchApi.search(userId, q),
      searchUsersQuerySchema,
      searchUsersResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
