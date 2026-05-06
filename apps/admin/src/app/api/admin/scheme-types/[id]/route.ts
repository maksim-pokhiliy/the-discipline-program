import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsSchemeTypeAdminApi } from "@repo/api-server/lms";
import {
  deleteSchemeTypeParamsSchema,
  getSchemeTypeByIdParamsSchema,
  getSchemeTypeResponseSchema,
  updateSchemeTypeParamsSchema,
  updateSchemeTypeRequestSchema,
  updateSchemeTypeResponseSchema,
} from "@repo/contracts/lms/scheme-type";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetByIdHandler(
      lmsSchemeTypeAdminApi.getSchemeTypeById,
      getSchemeTypeByIdParamsSchema,
      getSchemeTypeResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const PUT = withAdminAuth(
  withAuthRateLimit(
    createPutHandler(
      lmsSchemeTypeAdminApi.updateSchemeType,
      updateSchemeTypeParamsSchema,
      updateSchemeTypeRequestSchema,
      updateSchemeTypeResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createDeleteHandler(lmsSchemeTypeAdminApi.deleteSchemeType, deleteSchemeTypeParamsSchema),
    RATE_LIMIT_TIER.API,
  ),
);
