import { type z } from "zod";

import { type blockSchema } from "./block.schema";

export type Block = z.infer<typeof blockSchema>;
