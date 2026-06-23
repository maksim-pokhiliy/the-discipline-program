import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsLabelAdminApi } from "@repo/api-server/lms";
import {
  deleteLabelParamsSchema,
  getLabelByIdParamsSchema,
  labelSchema,
  updateLabelParamsSchema,
  updateLabelRequestSchema,
} from "@repo/contracts/lms/label";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetByIdHandler(cmsLabelAdminApi.getLabelById, getLabelByIdParamsSchema, labelSchema),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withAdminAuth(
  withAuthRateLimit(
    createPutHandler(
      cmsLabelAdminApi.updateLabel,
      updateLabelParamsSchema,
      updateLabelRequestSchema,
      labelSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createDeleteHandler(cmsLabelAdminApi.deleteLabel, deleteLabelParamsSchema),
    RATE_LIMIT_TIER.API,
  ),
);
