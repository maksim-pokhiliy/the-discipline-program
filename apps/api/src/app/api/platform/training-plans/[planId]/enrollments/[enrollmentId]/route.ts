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
import { handleApiError } from "@repo/errors";

import { getAuthenticatedUserId } from "@app/lib/auth";

type RouteContext = { params: Promise<{ planId: string; enrollmentId: string }> };

export const GET = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { planId, enrollmentId } = getPlanEnrollmentByIdParamsSchema.parse(await context.params);
    const data = await platformPlanEnrollmentsApi.getById(userId, planId, enrollmentId);
    const validated = getPlanEnrollmentResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT = async (request: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { planId, enrollmentId } = updatePlanEnrollmentParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = updatePlanEnrollmentRequestSchema.parse(body);
    const result = await platformPlanEnrollmentsApi.update(userId, planId, enrollmentId, data);
    const validated = updatePlanEnrollmentResponseSchema.parse(result);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { planId, enrollmentId } = deletePlanEnrollmentParamsSchema.parse(await context.params);

    await platformPlanEnrollmentsApi.delete(userId, planId, enrollmentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
