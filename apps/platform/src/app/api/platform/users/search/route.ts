import {
  createAuthGetWithQueryHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { iamUserSearchApi } from "@repo/api-server/iam";
import { searchUsersQuerySchema, searchUsersResponseSchema } from "@repo/contracts/iam/user";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      (userId, { q }) => iamUserSearchApi.search(userId, q),
      searchUsersQuerySchema,
      searchUsersResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
