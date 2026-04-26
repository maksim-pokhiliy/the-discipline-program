import { type z } from "zod";

import { type dayKindSchema } from "./day-kind.schema";

export type DayKind = z.infer<typeof dayKindSchema>;

export const DAY_KINDS: readonly DayKind[] = ["TRAINING", "REST", "YOGA", "OFF"] as const;
