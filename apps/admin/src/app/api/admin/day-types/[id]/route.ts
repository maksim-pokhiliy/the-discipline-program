import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsDayTypeAdminApi } from "@repo/api-server/lms";
import {
  deleteDayTypeParamsSchema,
  getDayTypeByIdParamsSchema,
  getDayTypeResponseSchema,
  updateDayTypeParamsSchema,
  updateDayTypeRequestSchema,
  updateDayTypeResponseSchema,
} from "@repo/contracts/lms/day-type";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetByIdHandler(
      lmsDayTypeAdminApi.getDayTypeById,
      getDayTypeByIdParamsSchema,
      getDayTypeResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const PUT = withAdminAuth(
  withAuthRateLimit(
    createPutHandler(
      lmsDayTypeAdminApi.updateDayType,
      updateDayTypeParamsSchema,
      updateDayTypeRequestSchema,
      updateDayTypeResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createDeleteHandler(lmsDayTypeAdminApi.deleteDayType, deleteDayTypeParamsSchema),
    RATE_LIMIT_TIER.API,
  ),
);
