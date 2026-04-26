import { type z } from "zod";

import { type blockKindSchema } from "./block-kind.schema";

export type BlockKind = z.infer<typeof blockKindSchema>;
