import { NextResponse } from "next/server";

import { platformPlanEnrollmentsApi } from "@repo/api-server";
import {
  deletePlanEnrollmentParamsSchema,
  getPlanEnrollmentByIdParamsSchema,
  getPlanEnrollmentResponseSchema,
  updatePlanEnrollmentParamsSchema,
  updatePlanEnrollmentRequestSchema,
  updatePlanEnrollmentResponseSchema,
} from "@repo/contracts/plan-enrollment";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(async (_, context, userId) => {
  const { planId, enrollmentId } = getPlanEnrollmentByIdParamsSchema.parse(await context.params);
  const data = await platformPlanEnrollmentsApi.getById(userId, planId, enrollmentId);
  const validated = getPlanEnrollmentResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const PUT = withPlatformAuth(async (request, context, userId) => {
  const { planId, enrollmentId } = updatePlanEnrollmentParamsSchema.parse(await context.params);
  const body = await request.json();
  const data = updatePlanEnrollmentRequestSchema.parse(body);
  const result = await platformPlanEnrollmentsApi.update(userId, planId, enrollmentId, data);
  const validated = updatePlanEnrollmentResponseSchema.parse(result);

  return NextResponse.json(validated);
});

export const DELETE = withPlatformAuth(async (_, context, userId) => {
  const { planId, enrollmentId } = deletePlanEnrollmentParamsSchema.parse(await context.params);

  await platformPlanEnrollmentsApi.delete(userId, planId, enrollmentId);

  return NextResponse.json({ success: true });
});
