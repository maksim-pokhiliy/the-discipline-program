import { type z } from "zod";

import {
  type createPlanOverrideInputSchema,
  type createPlanOverrideResponseSchema,
  type getPlanOverrideResponseSchema,
  type listPlanOverridesQuerySchema,
  type listPlanOverridesResponseSchema,
  type planOverrideIdParamSchema,
  type updatePlanOverrideInputSchema,
  type updatePlanOverrideResponseSchema,
} from "./plan-override-api.schema";

export type CreatePlanOverrideInput = z.infer<typeof createPlanOverrideInputSchema>;
export type UpdatePlanOverrideInput = z.infer<typeof updatePlanOverrideInputSchema>;
export type PlanOverrideIdParam = z.infer<typeof planOverrideIdParamSchema>;
export type ListPlanOverridesQuery = z.infer<typeof listPlanOverridesQuerySchema>;
export type ListPlanOverridesResponse = z.infer<typeof listPlanOverridesResponseSchema>;
export type GetPlanOverrideResponse = z.infer<typeof getPlanOverrideResponseSchema>;
export type CreatePlanOverrideResponse = z.infer<typeof createPlanOverrideResponseSchema>;
export type UpdatePlanOverrideResponse = z.infer<typeof updatePlanOverrideResponseSchema>;
