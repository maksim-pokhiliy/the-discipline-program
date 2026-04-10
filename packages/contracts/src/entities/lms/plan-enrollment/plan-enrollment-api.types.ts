import { type z } from "zod";

import {
  type createPlanEnrollmentParamsSchema,
  type createPlanEnrollmentRequestSchema,
  type createPlanEnrollmentResponseSchema,
  type deletePlanEnrollmentParamsSchema,
  type updatePlanEnrollmentParamsSchema,
  type updatePlanEnrollmentRequestSchema,
  type updatePlanEnrollmentResponseSchema,
} from "./plan-enrollment-api.schema";

export type CreatePlanEnrollmentParams = z.infer<typeof createPlanEnrollmentParamsSchema>;
export type CreatePlanEnrollmentRequest = z.infer<typeof createPlanEnrollmentRequestSchema>;
export type CreatePlanEnrollmentResponse = z.infer<typeof createPlanEnrollmentResponseSchema>;
export type UpdatePlanEnrollmentParams = z.infer<typeof updatePlanEnrollmentParamsSchema>;
export type UpdatePlanEnrollmentRequest = z.infer<typeof updatePlanEnrollmentRequestSchema>;
export type UpdatePlanEnrollmentResponse = z.infer<typeof updatePlanEnrollmentResponseSchema>;
export type DeletePlanEnrollmentParams = z.infer<typeof deletePlanEnrollmentParamsSchema>;
