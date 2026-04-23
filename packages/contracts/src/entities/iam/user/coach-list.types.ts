import type { z } from "zod";

import type { coachListItemSchema } from "./coach-list.schema";

export type CoachListItem = z.infer<typeof coachListItemSchema>;
