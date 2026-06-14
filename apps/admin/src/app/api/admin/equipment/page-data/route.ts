import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsEquipmentAdminApi } from "@repo/api-server/lms";
import { getEquipmentPageDataResponseSchema } from "@repo/contracts/lms/equipment";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsEquipmentAdminApi.getEquipmentPageData, getEquipmentPageDataResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
