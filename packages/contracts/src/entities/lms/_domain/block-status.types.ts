import { type z } from "zod";

import { type blockStatusSchema } from "./block-status.schema";

export type BlockStatus = z.infer<typeof blockStatusSchema>;

export const BLOCK_STATUSES: readonly BlockStatus[] = ["ACTIVE", "SUSPENDED"] as const;
