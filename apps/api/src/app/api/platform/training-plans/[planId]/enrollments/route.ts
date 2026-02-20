import { NextResponse } from "next/server";

import { platformPlanEnrollmentsApi } from "@repo/api-server";
import {
  createPlanEnrollmentParamsSchema,
  createPlanEnrollmentRequestSchema,
  createPlanEnrollmentResponseSchema,
  getPlanEnrollmentsParamsSchema,
  getPlanEnrollmentsResponseSchema,
} from "@repo/contracts/plan-enrollment";

import { getAuthenticatedUserId } from "@app/lib/auth";
import { handleApiError } from "@app/lib/error-handler";

type RouteContext = { params: Promise<{ planId: string }> };

export const GET = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { planId } = getPlanEnrollmentsParamsSchema.parse(await context.params);
    const data = await platformPlanEnrollmentsApi.getAll(userId, planId);
    const validated = getPlanEnrollmentsResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = async (request: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { planId } = createPlanEnrollmentParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = createPlanEnrollmentRequestSchema.parse(body);
    const result = await platformPlanEnrollmentsApi.create(userId, planId, data);
    const validated = createPlanEnrollmentResponseSchema.parse(result);

    return NextResponse.json(validated, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
