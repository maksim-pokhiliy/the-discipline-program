import { type z } from "zod";

import { type prKindSchema } from "./pr-kind.schema";

export type PrKind = z.infer<typeof prKindSchema>;

export const PR_KINDS: readonly PrKind[] = [
  "ONE_REP_MAX",
  "N_REP_MAX",
  "MAX_REPS_UNBROKEN",
  "MAX_REPS_TOTAL",
  "BEST_TIME_FOR_X",
  "MAX_DISTANCE_IN_T",
  "MAX_CALORIES_IN_T",
  "MAX_LOAD_FOR_REPS",
] as const;
