import { NextResponse } from "next/server";

import { platformTrainingPlansApi } from "@repo/api-server";
import {
  deleteTrainingPlanParamsSchema,
  getTrainingPlanByIdParamsSchema,
  getTrainingPlanResponseSchema,
  updateTrainingPlanParamsSchema,
  updateTrainingPlanRequestSchema,
  updateTrainingPlanResponseSchema,
} from "@repo/contracts/training-plan";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(async (_, context, userId) => {
  const { planId } = getTrainingPlanByIdParamsSchema.parse(await context.params);
  const data = await platformTrainingPlansApi.getById(userId, planId);
  const validated = getTrainingPlanResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const PUT = withPlatformAuth(async (request, context, userId) => {
  const { planId } = updateTrainingPlanParamsSchema.parse(await context.params);
  const body = await request.json();
  const data = updateTrainingPlanRequestSchema.parse(body);
  const result = await platformTrainingPlansApi.update(userId, planId, data);
  const validated = updateTrainingPlanResponseSchema.parse(result);

  return NextResponse.json(validated);
});

export const DELETE = withPlatformAuth(async (_, context, userId) => {
  const { planId } = deleteTrainingPlanParamsSchema.parse(await context.params);

  await platformTrainingPlansApi.delete(userId, planId);

  return NextResponse.json({ success: true });
});
