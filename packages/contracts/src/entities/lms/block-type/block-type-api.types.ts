import { type z } from "zod";

import {
  type createBlockTypeRequestSchema,
  type createBlockTypeResponseSchema,
  type deleteBlockTypeParamsSchema,
  type getBlockTypeByIdParamsSchema,
  type getBlockTypeResponseSchema,
  type getBlockTypesPageDataResponseSchema,
  type getBlockTypesResponseSchema,
  type updateBlockTypeParamsSchema,
  type updateBlockTypeRequestSchema,
  type updateBlockTypeResponseSchema,
} from "./block-type-api.schema";

export type GetBlockTypesResponse = z.infer<typeof getBlockTypesResponseSchema>;

export type GetBlockTypeByIdParams = z.infer<typeof getBlockTypeByIdParamsSchema>;

export type GetBlockTypeResponse = z.infer<typeof getBlockTypeResponseSchema>;

export type CreateBlockTypeRequest = z.infer<typeof createBlockTypeRequestSchema>;

export type CreateBlockTypeResponse = z.infer<typeof createBlockTypeResponseSchema>;

export type UpdateBlockTypeParams = z.infer<typeof updateBlockTypeParamsSchema>;

export type UpdateBlockTypeRequest = z.infer<typeof updateBlockTypeRequestSchema>;

export type UpdateBlockTypeResponse = z.infer<typeof updateBlockTypeResponseSchema>;

export type DeleteBlockTypeParams = z.infer<typeof deleteBlockTypeParamsSchema>;

export type GetBlockTypesPageDataResponse = z.infer<typeof getBlockTypesPageDataResponseSchema>;

export type AdminBlockTypesPageData = GetBlockTypesPageDataResponse;
