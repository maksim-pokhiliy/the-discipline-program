import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSchemaApi } from "@repo/api-server/lms";
import {
  type CreateSchemaRequest,
  createSchemaRequestSchema,
  createSchemaResponseSchema,
  schemaByPlanParamsSchema,
} from "@repo/contracts/lms/schema";

import { withCoachAuth } from "@app/lib/server/auth";

const toCreateArgs = (request: CreateSchemaRequest) => {
  const { blockId, parentSchemaId, ...data } = request;
  const scope = parentSchemaId != null ? { parentSchemaId } : { blockId };

  return { scope, data };
};

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId }, request) => {
        const { scope, data } = toCreateArgs(request);

        return lmsSchemaApi.create(userId, planId, scope, data);
      },
      schemaByPlanParamsSchema,
      createSchemaRequestSchema,
      createSchemaResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
