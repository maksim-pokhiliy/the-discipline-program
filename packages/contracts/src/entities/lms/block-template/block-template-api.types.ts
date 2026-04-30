import { type z } from "zod";

import {
  type createBlockTemplateInputSchema,
  type createBlockTemplateResponseSchema,
  type demoteBlockTemplateInputSchema,
  type demoteBlockTemplateResponseSchema,
  type getBlockTemplateResponseSchema,
  type listBlockTemplatesQuerySchema,
  type listBlockTemplatesResponseSchema,
  type promoteBlockTemplateResponseSchema,
  type blockTemplateIdParamSchema,
  type updateBlockTemplateInputSchema,
  type updateBlockTemplateResponseSchema,
} from "./block-template-api.schema";

export type CreateBlockTemplateInput = z.infer<typeof createBlockTemplateInputSchema>;
export type UpdateBlockTemplateInput = z.infer<typeof updateBlockTemplateInputSchema>;
export type BlockTemplateIdParam = z.infer<typeof blockTemplateIdParamSchema>;
export type ListBlockTemplatesQuery = z.infer<typeof listBlockTemplatesQuerySchema>;
export type ListBlockTemplatesResponse = z.infer<typeof listBlockTemplatesResponseSchema>;
export type GetBlockTemplateResponse = z.infer<typeof getBlockTemplateResponseSchema>;
export type CreateBlockTemplateResponse = z.infer<typeof createBlockTemplateResponseSchema>;
export type UpdateBlockTemplateResponse = z.infer<typeof updateBlockTemplateResponseSchema>;
export type PromoteBlockTemplateResponse = z.infer<typeof promoteBlockTemplateResponseSchema>;
export type DemoteBlockTemplateInput = z.infer<typeof demoteBlockTemplateInputSchema>;
export type DemoteBlockTemplateResponse = z.infer<typeof demoteBlockTemplateResponseSchema>;
