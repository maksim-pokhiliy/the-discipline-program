import { NextResponse } from "next/server";

import { platformTrainingPlansApi } from "@repo/api-server";
import {
  getTrainingPlanByIdParamsSchema,
  updateTrainingPlanResponseSchema,
} from "@repo/contracts/training-plan";

import { withPlatformAuth } from "@app/lib/auth";

export const POST = withPlatformAuth(async (_, context, userId) => {
  const { planId } = getTrainingPlanByIdParamsSchema.parse(await context.params);
  const result = await platformTrainingPlansApi.activate(userId, planId);
  const validated = updateTrainingPlanResponseSchema.parse(result);

  return NextResponse.json(validated);
});
