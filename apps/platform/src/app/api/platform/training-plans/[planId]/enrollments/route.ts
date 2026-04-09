import { createAuthGetByParamHandler, createAuthPostByParamHandler } from "@repo/api-routes";
import { platformPlanEnrollmentsApi } from "@repo/api-server";
import {
  createPlanEnrollmentParamsSchema,
  createPlanEnrollmentRequestSchema,
  createPlanEnrollmentResponseSchema,
  getPlanEnrollmentsParamsSchema,
  getPlanEnrollmentsResponseSchema,
} from "@repo/contracts/plan-enrollment";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetByParamHandler(
    (userId, { planId }) => platformPlanEnrollmentsApi.getAll(userId, planId),
    getPlanEnrollmentsParamsSchema,
    getPlanEnrollmentsResponseSchema,
  ),
);

export const POST = withPlatformAuth(
  createAuthPostByParamHandler(
    (userId, { planId }, data) => platformPlanEnrollmentsApi.create(userId, planId, data),
    createPlanEnrollmentParamsSchema,
    createPlanEnrollmentRequestSchema,
    createPlanEnrollmentResponseSchema,
  ),
);
