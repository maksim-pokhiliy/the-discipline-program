import { createAuthActionHandler } from "@repo/api-routes";
import { platformTrainingPlansApi } from "@repo/api-server";
import {
  duplicateTrainingPlanParamsSchema,
  duplicateTrainingPlanResponseSchema,
} from "@repo/contracts/lms/training-plan";

import { withPlatformAuth } from "@app/lib/server/auth";

export const POST = withPlatformAuth(
  createAuthActionHandler(
    (userId, { planId }) => platformTrainingPlansApi.duplicate(userId, planId),
    duplicateTrainingPlanParamsSchema,
    duplicateTrainingPlanResponseSchema,
    201,
  ),
);
