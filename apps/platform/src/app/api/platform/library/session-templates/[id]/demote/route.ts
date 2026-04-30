import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSessionTemplateApi } from "@repo/api-server/lms/session-template";
import { idParamSchema } from "@repo/contracts/common";
import {
  demoteSessionTemplateInputSchema,
  demoteSessionTemplateResponseSchema,
} from "@repo/contracts/lms/session-template";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (actorId, { id }, data) => lmsSessionTemplateApi.demote(actorId, id, data),
      idParamSchema,
      demoteSessionTemplateInputSchema,
      demoteSessionTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
