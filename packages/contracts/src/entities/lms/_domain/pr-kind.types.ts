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

export const PR_KIND_LABELS: Record<PrKind, string> = {
  ONE_REP_MAX: "1RM",
  N_REP_MAX: "n-Rep Max",
  MAX_REPS_UNBROKEN: "Max Reps (unbroken)",
  MAX_REPS_TOTAL: "Max Reps (total)",
  BEST_TIME_FOR_X: "Best Time",
  MAX_DISTANCE_IN_T: "Max Distance",
  MAX_CALORIES_IN_T: "Max Calories",
  MAX_LOAD_FOR_REPS: "Max Load (reps)",
};

export const PR_KIND_OPTIONS: ReadonlyArray<{ value: PrKind; label: string }> = PR_KINDS.map(
  (value) => ({ value, label: PR_KIND_LABELS[value] }),
);
