import {
  createAuthPostHandler,
  createGetHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsBenchmarkDefinitionApi } from "@repo/api-server/lms";
import {
  createBenchmarkDefinitionRequestSchema,
  createBenchmarkDefinitionResponseSchema,
  getBenchmarkDefinitionsResponseSchema,
} from "@repo/contracts/lms/benchmark-definition";

import { withAdminAuth, withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  withAuthRateLimit(
    createGetHandler(
      () => lmsBenchmarkDefinitionApi.getAll(),
      getBenchmarkDefinitionsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => lmsBenchmarkDefinitionApi.create(userId, data),
      createBenchmarkDefinitionRequestSchema,
      createBenchmarkDefinitionResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
