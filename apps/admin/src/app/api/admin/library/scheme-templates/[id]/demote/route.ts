import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSchemeTemplateApi } from "@repo/api-server/lms/scheme-template";
import { idParamSchema } from "@repo/contracts/common";
import {
  demoteSchemeTemplateInputSchema,
  demoteSchemeTemplateResponseSchema,
} from "@repo/contracts/lms/scheme-template";

import { withAdminAuth } from "@app/lib/server/auth";

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (actorId, { id }, data) => lmsSchemeTemplateApi.demote(actorId, id, data),
      idParamSchema,
      demoteSchemeTemplateInputSchema,
      demoteSchemeTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
