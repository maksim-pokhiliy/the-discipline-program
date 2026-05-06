import { z } from "zod";

import {
  createPlanEnrollmentSchema,
  enrollmentStatusSchema,
  planEnrollmentSchema,
} from "./plan-enrollment.schema";

export const planEnrollmentParamsSchema = z.object({
  planId: z.string().cuid(),
  enrollmentId: z.string().cuid(),
});

export const planEnrollmentsByPlanParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const getPlanEnrollmentsQuerySchema = z.object({
  status: enrollmentStatusSchema.optional(),
});

export const getPlanEnrollmentsResponseSchema = z.object({
  enrollments: z.array(planEnrollmentSchema),
});

export const getPlanEnrollmentResponseSchema = planEnrollmentSchema;

export const createPlanEnrollmentRequestSchema = createPlanEnrollmentSchema.omit({ planId: true });

export const createPlanEnrollmentResponseSchema = planEnrollmentSchema;

export const pausePlanEnrollmentResponseSchema = planEnrollmentSchema;

export const resumePlanEnrollmentResponseSchema = planEnrollmentSchema;
