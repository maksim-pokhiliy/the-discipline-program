import { createAuthPostHandler, createGetHandler } from "@repo/api-routes";
import { platformBenchmarkDefinitionsApi } from "@repo/api-server/lms";
import {
  createBenchmarkDefinitionRequestSchema,
  createBenchmarkDefinitionResponseSchema,
  getBenchmarkDefinitionsResponseSchema,
} from "@repo/contracts/lms/benchmark-definition";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createGetHandler(
    () => platformBenchmarkDefinitionsApi.getAll(),
    getBenchmarkDefinitionsResponseSchema,
  ),
);

export const POST = withPlatformAuth(
  createAuthPostHandler(
    (userId, data) => platformBenchmarkDefinitionsApi.create(userId, data),
    createBenchmarkDefinitionRequestSchema,
    createBenchmarkDefinitionResponseSchema,
  ),
);
