import { z } from "zod";

import { planIdParamSchema } from "../../../common";

import { planCoachAssignmentSchema } from "./plan-coach-assignment.schema";

export const createPlanCoachAssignmentInputSchema = z.object({
  coachId: z.string().cuid(),
  canEdit: z.boolean().default(true),
});

export const updatePlanCoachAssignmentInputSchema = z.object({
  canEdit: z.boolean().optional(),
});

export const planCoachAssignmentIdParamSchema = planIdParamSchema.extend({
  assignmentId: z.string().cuid(),
});

export const listPlanCoachAssignmentsResponseSchema = z.object({
  items: z.array(planCoachAssignmentSchema),
  total: z.number().int().nonnegative(),
});

export const getPlanCoachAssignmentResponseSchema = planCoachAssignmentSchema;
export const createPlanCoachAssignmentResponseSchema = planCoachAssignmentSchema;
export const updatePlanCoachAssignmentResponseSchema = planCoachAssignmentSchema;
