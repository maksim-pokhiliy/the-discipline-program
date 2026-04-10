import { createAuthActionHandler } from "@repo/api-routes";
import { platformTrainingPlansApi } from "@repo/api-server";
import {
  restoreTrainingPlanParamsSchema,
  updateTrainingPlanResponseSchema,
} from "@repo/contracts/lms/training-plan";

import { withPlatformAuth } from "@app/lib/server/auth";

export const POST = withPlatformAuth(
  createAuthActionHandler(
    (userId, { planId }) => platformTrainingPlansApi.restore(userId, planId),
    restoreTrainingPlanParamsSchema,
    updateTrainingPlanResponseSchema,
  ),
);
