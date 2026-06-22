import {
  createGetHandler,
  createPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { profileAxisAdminApi } from "@repo/api-server/coaching";
import {
  createProfileAxisRequestSchema,
  getProfileAxesResponseSchema,
  profileAxisSchema,
} from "@repo/contracts/coaching/profile-axis";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(profileAxisAdminApi.getProfileAxes, getProfileAxesResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
export const POST = withAdminAuth(
  withAuthRateLimit(
    createPostHandler(
      profileAxisAdminApi.createProfileAxis,
      createProfileAxisRequestSchema,
      profileAxisSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
