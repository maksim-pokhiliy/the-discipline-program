import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsLabelAdminApi } from "@repo/api-server/cms";
import { getLabelsPageDataResponseSchema } from "@repo/contracts/cms/label";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsLabelAdminApi.getLabelsPageData, getLabelsPageDataResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
