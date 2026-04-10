import { type z } from "zod";

import {
  type getPlanRosterEntryByIdParamsSchema,
  type getPlanRosterEntryResponseSchema,
  type getPlanRosterParamsSchema,
  type getPlanRosterResponseSchema,
} from "./plan-roster-api.schema";

export type GetPlanRosterParams = z.infer<typeof getPlanRosterParamsSchema>;
export type GetPlanRosterResponse = z.infer<typeof getPlanRosterResponseSchema>;
export type GetPlanRosterEntryByIdParams = z.infer<typeof getPlanRosterEntryByIdParamsSchema>;
export type GetPlanRosterEntryResponse = z.infer<typeof getPlanRosterEntryResponseSchema>;
