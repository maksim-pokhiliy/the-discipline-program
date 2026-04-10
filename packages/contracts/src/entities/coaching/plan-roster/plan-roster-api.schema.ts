import { z } from "zod";

import { planIdParamSchema } from "../../../common";

import { planRosterEntrySchema } from "./plan-roster.schema";

const planIdWithEnrollmentIdParamSchema = planIdParamSchema.extend({
  enrollmentId: z.string().cuid(),
});

export const getPlanRosterParamsSchema = planIdParamSchema;

export const getPlanRosterResponseSchema = z.array(planRosterEntrySchema);

export const getPlanRosterEntryByIdParamsSchema = planIdWithEnrollmentIdParamSchema;

export const getPlanRosterEntryResponseSchema = planRosterEntrySchema;
