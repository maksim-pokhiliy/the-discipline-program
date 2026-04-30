import { type z } from "zod";

import { type loadSpecKindSchema, type loadSpecSchema } from "./load-spec.schema";

export type LoadSpec = z.infer<typeof loadSpecSchema>;
export type LoadSpecKind = z.infer<typeof loadSpecKindSchema>;

export const LOAD_SPEC_KINDS: readonly LoadSpecKind[] = [
  "NONE",
  "SINGLE_DB",
  "DOUBLE_DB",
  "KB",
  "BARBELL",
  "RX_SCALED",
  "BANDED",
  "BODYWEIGHT_PLUS",
  "PERCENT_BENCHMARK",
] as const;
