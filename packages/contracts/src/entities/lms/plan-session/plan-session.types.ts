import { type z } from "zod";

import {
  type createPlanSessionSchema,
  type planSessionSchema,
  type updatePlanSessionSchema,
} from "./plan-session.schema";

export type PlanSession = z.infer<typeof planSessionSchema>;
export type CreatePlanSessionData = z.infer<typeof createPlanSessionSchema>;
export type UpdatePlanSessionData = z.infer<typeof updatePlanSessionSchema>;
