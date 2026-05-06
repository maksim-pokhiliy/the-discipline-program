import { type z } from "zod";

import {
  type createPlanItemSchema,
  type planItemAlternativeSchema,
  type planItemSchema,
  type updatePlanItemSchema,
} from "./plan-item.schema";

export type PlanItem = z.infer<typeof planItemSchema>;
export type PlanItemAlternative = z.infer<typeof planItemAlternativeSchema>;
export type CreatePlanItemData = z.infer<typeof createPlanItemSchema>;
export type UpdatePlanItemData = z.infer<typeof updatePlanItemSchema>;
