import { NextResponse } from "next/server";

import { platformTrainingPlansApi } from "@repo/api-server";
import {
  restoreTrainingPlanParamsSchema,
  updateTrainingPlanResponseSchema,
} from "@repo/contracts/training-plan";

import { withPlatformAuth } from "@app/lib/server/auth";

export const POST = withPlatformAuth(async (_, context, userId) => {
  const { planId } = restoreTrainingPlanParamsSchema.parse(await context.params);
  const result = await platformTrainingPlansApi.restore(userId, planId);
  const validated = updateTrainingPlanResponseSchema.parse(result);

  return NextResponse.json(validated);
});
