import { type z } from "zod";

import {
  type blockTypeSchema,
  type createBlockTypeSchema,
  type updateBlockTypeSchema,
} from "./block-type.schema";

export type BlockType = z.infer<typeof blockTypeSchema>;
export type CreateBlockTypeData = z.infer<typeof createBlockTypeSchema>;
export type UpdateBlockTypeData = z.infer<typeof updateBlockTypeSchema>;
