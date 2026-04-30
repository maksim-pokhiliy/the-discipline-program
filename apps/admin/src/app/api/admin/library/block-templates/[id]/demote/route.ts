import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsBlockTemplateApi } from "@repo/api-server/lms/block-template";
import { idParamSchema } from "@repo/contracts/common";
import {
  demoteBlockTemplateInputSchema,
  demoteBlockTemplateResponseSchema,
} from "@repo/contracts/lms/block-template";

import { withAdminAuth } from "@app/lib/server/auth";

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (actorId, { id }, data) => lmsBlockTemplateApi.demote(actorId, id, data),
      idParamSchema,
      demoteBlockTemplateInputSchema,
      demoteBlockTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
