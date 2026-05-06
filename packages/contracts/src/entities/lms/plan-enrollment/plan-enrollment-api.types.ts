import { type z } from "zod";

import {
  type createPlanEnrollmentRequestSchema,
  type createPlanEnrollmentResponseSchema,
  type getPlanEnrollmentResponseSchema,
  type getPlanEnrollmentsQuerySchema,
  type getPlanEnrollmentsResponseSchema,
  type pausePlanEnrollmentResponseSchema,
  type planEnrollmentParamsSchema,
  type planEnrollmentsByPlanParamsSchema,
  type resumePlanEnrollmentResponseSchema,
} from "./plan-enrollment-api.schema";

export type PlanEnrollmentParams = z.infer<typeof planEnrollmentParamsSchema>;
export type PlanEnrollmentsByPlanParams = z.infer<typeof planEnrollmentsByPlanParamsSchema>;
export type GetPlanEnrollmentsQuery = z.infer<typeof getPlanEnrollmentsQuerySchema>;
export type GetPlanEnrollmentsResponse = z.infer<typeof getPlanEnrollmentsResponseSchema>;
export type GetPlanEnrollmentResponse = z.infer<typeof getPlanEnrollmentResponseSchema>;
export type CreatePlanEnrollmentRequest = z.infer<typeof createPlanEnrollmentRequestSchema>;
export type CreatePlanEnrollmentResponse = z.infer<typeof createPlanEnrollmentResponseSchema>;
export type PausePlanEnrollmentResponse = z.infer<typeof pausePlanEnrollmentResponseSchema>;
export type ResumePlanEnrollmentResponse = z.infer<typeof resumePlanEnrollmentResponseSchema>;
