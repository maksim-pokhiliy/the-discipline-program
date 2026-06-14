import {
  createGetHandler,
  createPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsEquipmentAdminApi } from "@repo/api-server/lms";
import {
  createEquipmentRequestSchema,
  equipmentSchema,
  getEquipmentResponseSchema,
} from "@repo/contracts/lms/equipment";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsEquipmentAdminApi.getEquipment, getEquipmentResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
export const POST = withAdminAuth(
  withAuthRateLimit(
    createPostHandler(
      cmsEquipmentAdminApi.createEquipment,
      createEquipmentRequestSchema,
      equipmentSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
