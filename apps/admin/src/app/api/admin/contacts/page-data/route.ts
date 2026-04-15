import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsContactAdminApi } from "@repo/api-server/cms";
import { getContactsPageDataResponseSchema } from "@repo/contracts/cms/contact";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsContactAdminApi.getContactsPageData, getContactsPageDataResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
