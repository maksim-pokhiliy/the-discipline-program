import { createAuthGetByParamHandler, createAuthPostByParamHandler } from "@repo/api-routes";
import { coachingPlanRosterApi } from "@repo/api-server/coaching";
import { lmsPlanEnrollmentApi } from "@repo/api-server/lms";
import {
  getPlanRosterParamsSchema,
  getPlanRosterResponseSchema,
} from "@repo/contracts/coaching/plan-roster";
import {
  createPlanEnrollmentParamsSchema,
  createPlanEnrollmentRequestSchema,
  createPlanEnrollmentResponseSchema,
} from "@repo/contracts/lms/plan-enrollment";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetByParamHandler(
    (userId, { planId }) => coachingPlanRosterApi.list(userId, planId),
    getPlanRosterParamsSchema,
    getPlanRosterResponseSchema,
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
