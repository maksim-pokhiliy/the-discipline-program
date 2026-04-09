import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
} from "@repo/api-routes";
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

export const GET = withPlatformAuth(
  createAuthGetByParamHandler(
    (userId, { planId, enrollmentId }) =>
      platformPlanEnrollmentsApi.getById(userId, planId, enrollmentId),
    getPlanEnrollmentByIdParamsSchema,
    getPlanEnrollmentResponseSchema,
  ),
);

export const PUT = withPlatformAuth(
  createAuthPutByParamHandler(
    (userId, { planId, enrollmentId }, data) =>
      platformPlanEnrollmentsApi.update(userId, planId, enrollmentId, data),
    updatePlanEnrollmentParamsSchema,
    updatePlanEnrollmentRequestSchema,
    updatePlanEnrollmentResponseSchema,
  ),
);

export const DELETE = withPlatformAuth(
  createAuthDeleteHandler(
    (userId, { planId, enrollmentId }) =>
      platformPlanEnrollmentsApi.delete(userId, planId, enrollmentId),
    deletePlanEnrollmentParamsSchema,
  ),
);
