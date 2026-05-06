import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsBlockTypeAdminApi } from "@repo/api-server/lms";
import {
  deleteBlockTypeParamsSchema,
  getBlockTypeByIdParamsSchema,
  getBlockTypeResponseSchema,
  updateBlockTypeParamsSchema,
  updateBlockTypeRequestSchema,
  updateBlockTypeResponseSchema,
} from "@repo/contracts/lms/block-type";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetByIdHandler(
      lmsBlockTypeAdminApi.getBlockTypeById,
      getBlockTypeByIdParamsSchema,
      getBlockTypeResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const PUT = withAdminAuth(
  withAuthRateLimit(
    createPutHandler(
      lmsBlockTypeAdminApi.updateBlockType,
      updateBlockTypeParamsSchema,
      updateBlockTypeRequestSchema,
      updateBlockTypeResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createDeleteHandler(lmsBlockTypeAdminApi.deleteBlockType, deleteBlockTypeParamsSchema),
    RATE_LIMIT_TIER.API,
  ),
);
