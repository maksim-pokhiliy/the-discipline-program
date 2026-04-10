import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
} from "@repo/api-routes";
import { platformBenchmarkDefinitionsApi } from "@repo/api-server/lms";
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
  createAuthGetByParamHandler(
    (_userId, { definitionId }) => platformBenchmarkDefinitionsApi.getById(definitionId),
    getBenchmarkDefinitionByIdParamsSchema,
    getBenchmarkDefinitionResponseSchema,
  ),
);

export const PUT = withPlatformAuth(
  createAuthPutByParamHandler(
    (userId, { definitionId }, data) =>
      platformBenchmarkDefinitionsApi.update(userId, definitionId, data),
    updateBenchmarkDefinitionParamsSchema,
    updateBenchmarkDefinitionRequestSchema,
    updateBenchmarkDefinitionResponseSchema,
  ),
);

export const DELETE = withPlatformAuth(
  createAuthDeleteHandler(
    (userId, { definitionId }) => platformBenchmarkDefinitionsApi.delete(userId, definitionId),
    deleteBenchmarkDefinitionParamsSchema,
  ),
);
