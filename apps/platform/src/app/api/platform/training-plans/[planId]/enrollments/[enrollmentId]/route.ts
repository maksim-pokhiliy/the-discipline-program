import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
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
  createAuthGetByParamHandler(
    (userId, { planId, enrollmentId }) =>
      coachingPlanRosterApi.getById(userId, planId, enrollmentId),
    getPlanRosterEntryByIdParamsSchema,
    getPlanRosterEntryResponseSchema,
  ),
);

export const PUT = withPlatformAuth(
  createAuthPutByParamHandler(
    (userId, { planId, enrollmentId }, data) =>
      lmsPlanEnrollmentApi.update(userId, planId, enrollmentId, data),
    updatePlanEnrollmentParamsSchema,
    updatePlanEnrollmentRequestSchema,
    updatePlanEnrollmentResponseSchema,
  ),
);

export const DELETE = withPlatformAuth(
  createAuthDeleteHandler(
    (userId, { planId, enrollmentId }) => lmsPlanEnrollmentApi.delete(userId, planId, enrollmentId),
    deletePlanEnrollmentParamsSchema,
  ),
);
