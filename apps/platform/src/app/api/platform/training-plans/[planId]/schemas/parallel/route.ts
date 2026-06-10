import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSchemaApi } from "@repo/api-server/lms";
import {
  type CreateParallelSchemasRequest,
  createParallelSchemasRequestSchema,
  createParallelSchemasResponseSchema,
  schemaByPlanParamsSchema,
} from "@repo/contracts/lms/schema";

import { withCoachAuth } from "@app/lib/server/auth";

const toCreateArgs = (request: CreateParallelSchemasRequest) => {
  const { blockId, parentSchemaId, ...data } = request;
  const scope = parentSchemaId != null ? { parentSchemaId } : { blockId };

  return { scope, data };
};

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId }, request) => {
        const { scope, data } = toCreateArgs(request);

        return lmsSchemaApi.createParallel(userId, planId, scope, data);
      },
      schemaByPlanParamsSchema,
      createParallelSchemasRequestSchema,
      createParallelSchemasResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
