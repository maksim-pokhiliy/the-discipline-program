import { type z } from "zod";

import {
  type createPlanDayRequestSchema,
  type createPlanDayResponseSchema,
  type getPlanDayResponseSchema,
  type getPlanDaysQuerySchema,
  type getPlanDaysResponseSchema,
  type planByPlanParamsSchema,
  type planDayParamsSchema,
  type updatePlanDayRequestSchema,
  type updatePlanDayResponseSchema,
} from "./plan-day-api.schema";

export type PlanDayParams = z.infer<typeof planDayParamsSchema>;
export type PlanByPlanParams = z.infer<typeof planByPlanParamsSchema>;
export type GetPlanDaysQuery = z.infer<typeof getPlanDaysQuerySchema>;
export type GetPlanDaysResponse = z.infer<typeof getPlanDaysResponseSchema>;
export type GetPlanDayResponse = z.infer<typeof getPlanDayResponseSchema>;
export type CreatePlanDayRequest = z.infer<typeof createPlanDayRequestSchema>;
export type CreatePlanDayResponse = z.infer<typeof createPlanDayResponseSchema>;
export type UpdatePlanDayRequest = z.infer<typeof updatePlanDayRequestSchema>;
export type UpdatePlanDayResponse = z.infer<typeof updatePlanDayResponseSchema>;
