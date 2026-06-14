import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsEquipmentAdminApi } from "@repo/api-server/lms";
import {
  deleteEquipmentParamsSchema,
  equipmentSchema,
  getEquipmentByIdParamsSchema,
  updateEquipmentParamsSchema,
  updateEquipmentRequestSchema,
} from "@repo/contracts/lms/equipment";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetByIdHandler(
      cmsEquipmentAdminApi.getEquipmentById,
      getEquipmentByIdParamsSchema,
      equipmentSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const PUT = withAdminAuth(
  withAuthRateLimit(
    createPutHandler(
      cmsEquipmentAdminApi.updateEquipment,
      updateEquipmentParamsSchema,
      updateEquipmentRequestSchema,
      equipmentSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createDeleteHandler(cmsEquipmentAdminApi.deleteEquipment, deleteEquipmentParamsSchema),
    RATE_LIMIT_TIER.API,
  ),
);
