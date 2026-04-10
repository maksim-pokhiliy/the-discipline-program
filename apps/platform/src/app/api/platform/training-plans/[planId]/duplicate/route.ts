import { createAuthActionHandler } from "@repo/api-routes";
import { lmsTrainingPlanApi } from "@repo/api-server/lms";
import {
  duplicateTrainingPlanParamsSchema,
  duplicateTrainingPlanResponseSchema,
} from "@repo/contracts/lms/training-plan";

import { withPlatformAuth } from "@app/lib/server/auth";

export const POST = withPlatformAuth(
  createAuthActionHandler(
    (userId, { planId }) => lmsTrainingPlanApi.duplicate(userId, planId),
    duplicateTrainingPlanParamsSchema,
    duplicateTrainingPlanResponseSchema,
    201,
  ),
);
