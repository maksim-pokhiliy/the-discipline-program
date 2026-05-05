import { type z } from "zod";

import {
  type createPlanDaySchema,
  type planDaySchema,
  type updatePlanDaySchema,
} from "./plan-day.schema";

export type PlanDay = z.infer<typeof planDaySchema>;
export type CreatePlanDayData = z.infer<typeof createPlanDaySchema>;
export type UpdatePlanDayData = z.infer<typeof updatePlanDaySchema>;
