import { type z } from "zod";

import {
  type createPlanCoachAssignmentInputSchema,
  type createPlanCoachAssignmentResponseSchema,
  type getPlanCoachAssignmentResponseSchema,
  type listPlanCoachAssignmentsResponseSchema,
  type planCoachAssignmentIdParamSchema,
  type updatePlanCoachAssignmentInputSchema,
  type updatePlanCoachAssignmentResponseSchema,
} from "./plan-coach-assignment-api.schema";

export type CreatePlanCoachAssignmentInput = z.infer<typeof createPlanCoachAssignmentInputSchema>;
export type UpdatePlanCoachAssignmentInput = z.infer<typeof updatePlanCoachAssignmentInputSchema>;
export type PlanCoachAssignmentIdParam = z.infer<typeof planCoachAssignmentIdParamSchema>;
export type ListPlanCoachAssignmentsResponse = z.infer<
  typeof listPlanCoachAssignmentsResponseSchema
>;
export type GetPlanCoachAssignmentResponse = z.infer<typeof getPlanCoachAssignmentResponseSchema>;
export type CreatePlanCoachAssignmentResponse = z.infer<
  typeof createPlanCoachAssignmentResponseSchema
>;
export type UpdatePlanCoachAssignmentResponse = z.infer<
  typeof updatePlanCoachAssignmentResponseSchema
>;
