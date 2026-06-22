import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { profileAxisAdminApi } from "@repo/api-server/coaching";
import {
  deleteProfileAxisParamsSchema,
  getProfileAxisByIdParamsSchema,
  profileAxisSchema,
  updateProfileAxisParamsSchema,
  updateProfileAxisRequestSchema,
} from "@repo/contracts/coaching/profile-axis";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetByIdHandler(
      profileAxisAdminApi.getProfileAxisById,
      getProfileAxisByIdParamsSchema,
      profileAxisSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const PUT = withAdminAuth(
  withAuthRateLimit(
    createPutHandler(
      profileAxisAdminApi.updateProfileAxis,
      updateProfileAxisParamsSchema,
      updateProfileAxisRequestSchema,
      profileAxisSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createDeleteHandler(profileAxisAdminApi.deleteProfileAxis, deleteProfileAxisParamsSchema),
    RATE_LIMIT_TIER.API,
  ),
);
