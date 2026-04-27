import { type z } from "zod";

import {
  type createPlanOverrideBodySchema,
  type createPlanOverrideInputSchema,
  type createPlanOverrideResponseSchema,
  type effectivePlanWeekSchema,
  type enrollmentOverrideParamSchema,
  type getPlanOverrideResponseSchema,
  type listEnrollmentOverridesResponseSchema,
  type listPlanOverridesQuerySchema,
  type listPlanOverridesResponseSchema,
  type overrideIdParamSchema,
  type planOverrideIdParamSchema,
  type updatePlanOverrideInputSchema,
  type updatePlanOverrideResponseSchema,
} from "./plan-override-api.schema";

export type CreatePlanOverrideBody = z.infer<typeof createPlanOverrideBodySchema>;
export type CreatePlanOverrideInput = z.infer<typeof createPlanOverrideInputSchema>;
export type UpdatePlanOverrideInput = z.infer<typeof updatePlanOverrideInputSchema>;
export type EnrollmentOverrideParam = z.infer<typeof enrollmentOverrideParamSchema>;
export type OverrideIdParam = z.infer<typeof overrideIdParamSchema>;
export type PlanOverrideIdParam = z.infer<typeof planOverrideIdParamSchema>;
export type ListPlanOverridesQuery = z.infer<typeof listPlanOverridesQuerySchema>;
export type ListPlanOverridesResponse = z.infer<typeof listPlanOverridesResponseSchema>;
export type ListEnrollmentOverridesResponse = z.infer<typeof listEnrollmentOverridesResponseSchema>;
export type GetPlanOverrideResponse = z.infer<typeof getPlanOverrideResponseSchema>;
export type CreatePlanOverrideResponse = z.infer<typeof createPlanOverrideResponseSchema>;
export type UpdatePlanOverrideResponse = z.infer<typeof updatePlanOverrideResponseSchema>;
export type EffectivePlanWeek = z.infer<typeof effectivePlanWeekSchema>;
