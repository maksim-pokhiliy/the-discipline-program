import { type z } from "zod";

import {
  type createPlanBlockSchema,
  type planBlockSchema,
  type updatePlanBlockSchema,
} from "./plan-block.schema";

export type PlanBlock = z.infer<typeof planBlockSchema>;
export type CreatePlanBlockData = z.infer<typeof createPlanBlockSchema>;
export type UpdatePlanBlockData = z.infer<typeof updatePlanBlockSchema>;
