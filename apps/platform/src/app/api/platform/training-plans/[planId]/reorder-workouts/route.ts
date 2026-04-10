import { createAuthVoidPutByParamHandler } from "@repo/api-routes";
import { platformWorkoutsApi } from "@repo/api-server/lms";
import {
  reorderWorkoutsParamsSchema,
  reorderWorkoutsRequestSchema,
} from "@repo/contracts/lms/workout";

import { withPlatformAuth } from "@app/lib/server/auth";

export const PUT = withPlatformAuth(
  createAuthVoidPutByParamHandler(
    (userId, { planId }, { orderedIds }) => platformWorkoutsApi.reorder(userId, planId, orderedIds),
    reorderWorkoutsParamsSchema,
    reorderWorkoutsRequestSchema,
  ),
);
