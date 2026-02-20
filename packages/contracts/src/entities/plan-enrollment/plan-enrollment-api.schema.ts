import { z } from "zod";

import {
  createPlanEnrollmentSchema,
  planEnrollmentSchema,
  updatePlanEnrollmentSchema,
} from "./plan-enrollment.schema";

export const getPlanEnrollmentsParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const getPlanEnrollmentsResponseSchema = z.array(planEnrollmentSchema);

export const getPlanEnrollmentByIdParamsSchema = z.object({
  planId: z.string().cuid(),
  enrollmentId: z.string().cuid(),
});

export const getPlanEnrollmentResponseSchema = planEnrollmentSchema;

export const createPlanEnrollmentParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const createPlanEnrollmentRequestSchema = createPlanEnrollmentSchema;

export const createPlanEnrollmentResponseSchema = planEnrollmentSchema;

export const updatePlanEnrollmentParamsSchema = z.object({
  planId: z.string().cuid(),
  enrollmentId: z.string().cuid(),
});

export const updatePlanEnrollmentRequestSchema = updatePlanEnrollmentSchema;

export const updatePlanEnrollmentResponseSchema = planEnrollmentSchema;

export const deletePlanEnrollmentParamsSchema = z.object({
  planId: z.string().cuid(),
  enrollmentId: z.string().cuid(),
});
