import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsBenchmarkDefinitionApi } from "@repo/api-server/lms";
import {
  deleteBenchmarkDefinitionParamsSchema,
  getBenchmarkDefinitionByIdParamsSchema,
  getBenchmarkDefinitionResponseSchema,
  updateBenchmarkDefinitionParamsSchema,
  updateBenchmarkDefinitionRequestSchema,
  updateBenchmarkDefinitionResponseSchema,
} from "@repo/contracts/lms/benchmark-definition";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (_userId, { definitionId }) => lmsBenchmarkDefinitionApi.getById(definitionId),
      getBenchmarkDefinitionByIdParamsSchema,
      getBenchmarkDefinitionResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withPlatformAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { definitionId }, data) =>
        lmsBenchmarkDefinitionApi.update(userId, definitionId, data),
      updateBenchmarkDefinitionParamsSchema,
      updateBenchmarkDefinitionRequestSchema,
      updateBenchmarkDefinitionResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withPlatformAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { definitionId }) => lmsBenchmarkDefinitionApi.delete(userId, definitionId),
      deleteBenchmarkDefinitionParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
