import { type z } from "zod";

import { type planRosterEntrySchema, type planRosterUserSchema } from "./plan-roster.schema";

export type PlanRosterUser = z.infer<typeof planRosterUserSchema>;
export type PlanRosterEntry = z.infer<typeof planRosterEntrySchema>;
