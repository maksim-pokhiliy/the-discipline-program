import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsModifierAdminApi } from "@repo/api-server/lms";
import {
  deleteModifierParamsSchema,
  getModifierByIdParamsSchema,
  modifierSchema,
  updateModifierParamsSchema,
  updateModifierRequestSchema,
} from "@repo/contracts/lms/modifier";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetByIdHandler(
      cmsModifierAdminApi.getModifierById,
      getModifierByIdParamsSchema,
      modifierSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const PUT = withAdminAuth(
  withAuthRateLimit(
    createPutHandler(
      cmsModifierAdminApi.updateModifier,
      updateModifierParamsSchema,
      updateModifierRequestSchema,
      modifierSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createDeleteHandler(cmsModifierAdminApi.deleteModifier, deleteModifierParamsSchema),
    RATE_LIMIT_TIER.API,
  ),
);
