import { z } from "zod";

import { planIdParamSchema } from "../../../common";

import {
  createPlanEnrollmentSchema,
  planEnrollmentSchema,
  updatePlanEnrollmentSchema,
} from "./plan-enrollment.schema";

const planIdWithEnrollmentIdParamSchema = planIdParamSchema.extend({
  enrollmentId: z.string().cuid(),
});

export const createPlanEnrollmentParamsSchema = planIdParamSchema;

export const createPlanEnrollmentRequestSchema = createPlanEnrollmentSchema;

export const createPlanEnrollmentResponseSchema = planEnrollmentSchema;

export const updatePlanEnrollmentParamsSchema = planIdWithEnrollmentIdParamSchema;

export const updatePlanEnrollmentRequestSchema = updatePlanEnrollmentSchema;

export const updatePlanEnrollmentResponseSchema = planEnrollmentSchema;

export const deletePlanEnrollmentParamsSchema = planIdWithEnrollmentIdParamSchema;
