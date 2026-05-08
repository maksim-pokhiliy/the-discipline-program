import { type z } from "zod";

import { type planItemForUpsertSchema } from "./plan-item-for-upsert.schema";
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
export type PlanItemForUpsert = z.infer<typeof planItemForUpsertSchema>;
