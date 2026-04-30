import { type z } from "zod";

import { type restSpecKindSchema, type restSpecSchema } from "./rest-spec.schema";

export type RestSpec = z.infer<typeof restSpecSchema>;
export type RestSpecKind = z.infer<typeof restSpecKindSchema>;

export const REST_SPEC_KINDS: readonly RestSpecKind[] = [
  "FIXED",
  "RANGE",
  "UNTIL_RECOVERY",
  "AFTER_NTH_SET",
] as const;
