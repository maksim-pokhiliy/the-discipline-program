import {
  createGetHandler,
  createPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsLabelAdminApi } from "@repo/api-server/cms";
import {
  createLabelRequestSchema,
  getLabelsResponseSchema,
  labelSchema,
} from "@repo/contracts/cms/label";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsLabelAdminApi.getLabels, getLabelsResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
export const POST = withAdminAuth(
  withAuthRateLimit(
    createPostHandler(cmsLabelAdminApi.createLabel, createLabelRequestSchema, labelSchema),
    RATE_LIMIT_TIER.API,
  ),
);
