import { type z } from "zod";

import {
  type createPlanCoachAssignmentInputSchema,
  type createPlanCoachAssignmentParamsSchema,
  type createPlanCoachAssignmentRequestSchema,
  type createPlanCoachAssignmentResponseSchema,
  type deletePlanCoachAssignmentParamsSchema,
  type getPlanCoachAssignmentResponseSchema,
  type listPlanCoachAssignmentsParamsSchema,
  type listPlanCoachAssignmentsResponseSchema,
  type planCoachAssignmentIdParamSchema,
  type updatePlanCoachAssignmentInputSchema,
  type updatePlanCoachAssignmentResponseSchema,
} from "./plan-coach-assignment-api.schema";

export type CreatePlanCoachAssignmentInput = z.infer<typeof createPlanCoachAssignmentInputSchema>;
export type UpdatePlanCoachAssignmentInput = z.infer<typeof updatePlanCoachAssignmentInputSchema>;
export type PlanCoachAssignmentIdParam = z.infer<typeof planCoachAssignmentIdParamSchema>;
export type ListPlanCoachAssignmentsParams = z.infer<typeof listPlanCoachAssignmentsParamsSchema>;
export type ListPlanCoachAssignmentsResponse = z.infer<
  typeof listPlanCoachAssignmentsResponseSchema
>;
export type GetPlanCoachAssignmentResponse = z.infer<typeof getPlanCoachAssignmentResponseSchema>;
export type CreatePlanCoachAssignmentParams = z.infer<typeof createPlanCoachAssignmentParamsSchema>;
export type CreatePlanCoachAssignmentRequest = z.infer<
  typeof createPlanCoachAssignmentRequestSchema
>;
export type CreatePlanCoachAssignmentResponse = z.infer<
  typeof createPlanCoachAssignmentResponseSchema
>;
export type UpdatePlanCoachAssignmentResponse = z.infer<
  typeof updatePlanCoachAssignmentResponseSchema
>;
export type DeletePlanCoachAssignmentParams = z.infer<typeof deletePlanCoachAssignmentParamsSchema>;
