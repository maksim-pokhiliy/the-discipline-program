import { type z } from "zod";

import {
  type localeCodeParamsSchema,
  type localeQuerySchema,
  type getLocalesResponseSchema,
  type createLocaleRequestSchema,
  type updateLocaleRequestSchema,
  type adminLocaleListItemSchema,
  type reorderLocalesRequestSchema,
  type reorderLocalesResponseSchema,
  type getPublicLocalesResponseSchema,
} from "./locale-api.schema";

export type LocaleCodeParams = z.infer<typeof localeCodeParamsSchema>;

export type LocaleQuery = z.input<typeof localeQuerySchema>;

export type GetLocalesResponse = z.infer<typeof getLocalesResponseSchema>;

export type AdminLocaleListItem = z.infer<typeof adminLocaleListItemSchema>;

export type CreateLocaleRequest = z.infer<typeof createLocaleRequestSchema>;

export type UpdateLocaleRequest = z.infer<typeof updateLocaleRequestSchema>;

export type ReorderLocalesRequest = z.infer<typeof reorderLocalesRequestSchema>;

export type ReorderLocalesResponse = z.infer<typeof reorderLocalesResponseSchema>;

export type GetPublicLocalesResponse = z.infer<typeof getPublicLocalesResponseSchema>;
