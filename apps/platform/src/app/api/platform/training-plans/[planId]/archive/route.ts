import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformTrainingPlansApi } from "@repo/api-server";
import {
  archiveTrainingPlanParamsSchema,
  updateTrainingPlanResponseSchema,
} from "@repo/contracts/training-plan";

export const POST = withPlatformAuth(async (_, context, userId) => {
  const { planId } = archiveTrainingPlanParamsSchema.parse(await context.params);
  const result = await platformTrainingPlansApi.archive(userId, planId);
  const validated = updateTrainingPlanResponseSchema.parse(result);

  return NextResponse.json(validated);
});
