import { type z } from "zod";

import {
  type blockKindIdParamSchema,
  type createBlockKindInputSchema,
  type createBlockKindResponseSchema,
  type getBlockKindResponseSchema,
  type listBlockKindsQuerySchema,
  type listBlockKindsResponseSchema,
  type updateBlockKindInputSchema,
  type updateBlockKindResponseSchema,
} from "./block-kind-api.schema";

export type CreateBlockKindInput = z.infer<typeof createBlockKindInputSchema>;
export type UpdateBlockKindInput = z.infer<typeof updateBlockKindInputSchema>;
export type BlockKindIdParam = z.infer<typeof blockKindIdParamSchema>;
export type ListBlockKindsQuery = z.infer<typeof listBlockKindsQuerySchema>;
export type ListBlockKindsResponse = z.infer<typeof listBlockKindsResponseSchema>;
export type GetBlockKindResponse = z.infer<typeof getBlockKindResponseSchema>;
export type CreateBlockKindResponse = z.infer<typeof createBlockKindResponseSchema>;
export type UpdateBlockKindResponse = z.infer<typeof updateBlockKindResponseSchema>;
