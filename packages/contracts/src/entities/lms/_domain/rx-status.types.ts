import { type z } from "zod";

import { type rxStatusSchema } from "./rx-status.schema";

export type RxStatus = z.infer<typeof rxStatusSchema>;

export const RX_STATUSES: readonly RxStatus[] = [
  "RX",
  "SCALED",
  "SUBSTITUTED",
  "MODIFIED",
] as const;
