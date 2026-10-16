import { type z } from "zod";

import {
  type localeCodeParamsSchema,
  type localeQuerySchema,
  type getLocalesResponseSchema,
  type createLocaleRequestSchema,
  type updateLocaleRequestSchema,
  type getPublicLocalesResponseSchema,
} from "./locale-api.schema";

export type LocaleCodeParams = z.infer<typeof localeCodeParamsSchema>;

export type LocaleQuery = z.infer<typeof localeQuerySchema>;

export type GetLocalesResponse = z.infer<typeof getLocalesResponseSchema>;

export type CreateLocaleRequest = z.infer<typeof createLocaleRequestSchema>;

export type UpdateLocaleRequest = z.infer<typeof updateLocaleRequestSchema>;

export type GetPublicLocalesResponse = z.infer<typeof getPublicLocalesResponseSchema>;
