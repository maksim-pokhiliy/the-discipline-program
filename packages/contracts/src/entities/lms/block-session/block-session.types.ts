import { type z } from "zod";

import { type blockResultPrimarySchema, type blockSessionSchema } from "./block-session.schema";

export type BlockSession = z.infer<typeof blockSessionSchema>;
export type BlockResultPrimary = z.infer<typeof blockResultPrimarySchema>;
