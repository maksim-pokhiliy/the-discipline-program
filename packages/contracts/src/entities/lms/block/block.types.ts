import { type z } from "zod";

import {
  type assignBlockLabelsSchema,
  type blockSchema,
  type createBlockSchema,
  type reorderBlocksSchema,
  type updateBlockSchema,
} from "./block.schema";

export type Block = z.infer<typeof blockSchema>;
export type CreateBlockData = z.infer<typeof createBlockSchema>;
export type UpdateBlockData = z.infer<typeof updateBlockSchema>;
export type ReorderBlocksData = z.infer<typeof reorderBlocksSchema>;
export type AssignBlockLabelsData = z.infer<typeof assignBlockLabelsSchema>;
