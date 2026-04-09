import { createAuthVoidPutByParamHandler } from "@repo/api-routes";
import { platformWorkoutsApi } from "@repo/api-server";
import { reorderWorkoutsParamsSchema, reorderWorkoutsRequestSchema } from "@repo/contracts/workout";

import { withPlatformAuth } from "@app/lib/server/auth";

export const PUT = withPlatformAuth(
  createAuthVoidPutByParamHandler(
    (userId, { planId }, { orderedIds }) => platformWorkoutsApi.reorder(userId, planId, orderedIds),
    reorderWorkoutsParamsSchema,
    reorderWorkoutsRequestSchema,
  ),
);
