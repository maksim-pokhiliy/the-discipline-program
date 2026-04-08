import { NextResponse } from "next/server";

import { platformTrainingPlansApi } from "@repo/api-server";
import {
  duplicateTrainingPlanParamsSchema,
  duplicateTrainingPlanResponseSchema,
} from "@repo/contracts/training-plan";

import { withPlatformAuth } from "@app/lib/server/auth";

export const POST = withPlatformAuth(async (_, context, userId) => {
  const { planId } = duplicateTrainingPlanParamsSchema.parse(await context.params);
  const result = await platformTrainingPlansApi.duplicate(userId, planId);
  const validated = duplicateTrainingPlanResponseSchema.parse(result);

  return NextResponse.json(validated, { status: 201 });
});
