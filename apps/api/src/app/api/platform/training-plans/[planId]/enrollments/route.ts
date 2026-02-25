import { NextResponse } from "next/server";

import { platformPlanEnrollmentsApi } from "@repo/api-server";
import {
  createPlanEnrollmentParamsSchema,
  createPlanEnrollmentRequestSchema,
  createPlanEnrollmentResponseSchema,
  getPlanEnrollmentsParamsSchema,
  getPlanEnrollmentsResponseSchema,
} from "@repo/contracts/plan-enrollment";

import { withPlatformAuth } from "@app/lib/auth";

export const GET = withPlatformAuth(async (_, context, userId) => {
  const { planId } = getPlanEnrollmentsParamsSchema.parse(await context.params);
  const data = await platformPlanEnrollmentsApi.getAll(userId, planId);
  const validated = getPlanEnrollmentsResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const POST = withPlatformAuth(async (request, context, userId) => {
  const { planId } = createPlanEnrollmentParamsSchema.parse(await context.params);
  const body = await request.json();
  const data = createPlanEnrollmentRequestSchema.parse(body);
  const result = await platformPlanEnrollmentsApi.create(userId, planId, data);
  const validated = createPlanEnrollmentResponseSchema.parse(result);

  return NextResponse.json(validated, { status: 201 });
});
