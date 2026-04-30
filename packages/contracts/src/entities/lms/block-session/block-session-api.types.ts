import { type z } from "zod";

import {
  type blockSessionIdParamSchema,
  type createBlockSessionInputSchema,
  type createBlockSessionResponseSchema,
  type getBlockSessionResponseSchema,
  type listBlockSessionsQuerySchema,
  type listBlockSessionsResponseSchema,
  type updateBlockSessionInputSchema,
  type updateBlockSessionResponseSchema,
} from "./block-session-api.schema";

export type CreateBlockSessionInput = z.infer<typeof createBlockSessionInputSchema>;
export type UpdateBlockSessionInput = z.infer<typeof updateBlockSessionInputSchema>;
export type BlockSessionIdParam = z.infer<typeof blockSessionIdParamSchema>;
export type ListBlockSessionsQuery = z.infer<typeof listBlockSessionsQuerySchema>;
export type ListBlockSessionsResponse = z.infer<typeof listBlockSessionsResponseSchema>;
export type GetBlockSessionResponse = z.infer<typeof getBlockSessionResponseSchema>;
export type CreateBlockSessionResponse = z.infer<typeof createBlockSessionResponseSchema>;
export type UpdateBlockSessionResponse = z.infer<typeof updateBlockSessionResponseSchema>;
