import { type z } from "zod";

import { type coachActionItemSchema } from "./coach-action-item.schema";

export type CoachActionItem = z.infer<typeof coachActionItemSchema>;
