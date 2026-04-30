import { createAuthActionHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsBlockTemplateApi } from "@repo/api-server/lms/block-template";
import { idParamSchema } from "@repo/contracts/common";
import { promoteBlockTemplateResponseSchema } from "@repo/contracts/lms/block-template";

import { withAdminAuth } from "@app/lib/server/auth";

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthActionHandler(
      (actorId, { id }) => lmsBlockTemplateApi.promote(actorId, id),
      idParamSchema,
      promoteBlockTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
