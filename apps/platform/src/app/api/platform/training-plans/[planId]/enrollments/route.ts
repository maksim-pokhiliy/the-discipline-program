import { createAuthGetByParamHandler, createAuthPostByParamHandler } from "@repo/api-routes";
import { lmsPlanEnrollmentApi } from "@repo/api-server/lms";
import {
  createPlanEnrollmentParamsSchema,
  createPlanEnrollmentRequestSchema,
  createPlanEnrollmentResponseSchema,
  getPlanEnrollmentsParamsSchema,
  getPlanEnrollmentsResponseSchema,
} from "@repo/contracts/lms/plan-enrollment";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetByParamHandler(
    (userId, { planId }) => lmsPlanEnrollmentApi.getAll(userId, planId),
    getPlanEnrollmentsParamsSchema,
    getPlanEnrollmentsResponseSchema,
  ),
);

export const POST = withPlatformAuth(
  createAuthPostByParamHandler(
    (userId, { planId }, data) => lmsPlanEnrollmentApi.create(userId, planId, data),
    createPlanEnrollmentParamsSchema,
    createPlanEnrollmentRequestSchema,
    createPlanEnrollmentResponseSchema,
  ),
);
