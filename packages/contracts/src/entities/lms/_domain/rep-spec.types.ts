import { type z } from "zod";

import { type repSpecKindSchema, type repSpecSchema } from "./rep-spec.schema";

export type RepSpec = z.infer<typeof repSpecSchema>;
export type RepSpecKind = z.infer<typeof repSpecKindSchema>;

export const REP_SPEC_KINDS: readonly RepSpecKind[] = [
  "FIXED",
  "RANGE",
  "EACH_SIDE",
  "AMRAP_REPS",
  "MAX",
] as const;
