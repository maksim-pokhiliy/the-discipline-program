import {
  createGetHandler,
  createPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsModifierAdminApi } from "@repo/api-server/lms";
import {
  createModifierRequestSchema,
  getModifiersResponseSchema,
  modifierSchema,
} from "@repo/contracts/lms/modifier";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsModifierAdminApi.getModifiers, getModifiersResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
export const POST = withAdminAuth(
  withAuthRateLimit(
    createPostHandler(
      cmsModifierAdminApi.createModifier,
      createModifierRequestSchema,
      modifierSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
