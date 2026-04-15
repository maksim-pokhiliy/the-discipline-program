import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { coachingPlanRosterApi } from "@repo/api-server/coaching";
import { lmsPlanEnrollmentApi } from "@repo/api-server/lms";
import {
  getPlanRosterEntryByIdParamsSchema,
  getPlanRosterEntryResponseSchema,
} from "@repo/contracts/coaching/plan-roster";
import {
  deletePlanEnrollmentParamsSchema,
  updatePlanEnrollmentParamsSchema,
  updatePlanEnrollmentRequestSchema,
  updatePlanEnrollmentResponseSchema,
} from "@repo/contracts/lms/plan-enrollment";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { planId, enrollmentId }) =>
        coachingPlanRosterApi.getById(userId, planId, enrollmentId),
      getPlanRosterEntryByIdParamsSchema,
      getPlanRosterEntryResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withPlatformAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId, enrollmentId }, data) =>
        lmsPlanEnrollmentApi.update(userId, planId, enrollmentId, data),
      updatePlanEnrollmentParamsSchema,
      updatePlanEnrollmentRequestSchema,
      updatePlanEnrollmentResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withPlatformAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { planId, enrollmentId }) =>
        lmsPlanEnrollmentApi.delete(userId, planId, enrollmentId),
      deletePlanEnrollmentParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
