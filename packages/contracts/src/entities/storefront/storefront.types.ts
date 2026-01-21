import { type z } from "zod";

import {
  type getStorefrontProgramStatsResponseSchema,
  type getStorefrontProgramsPageDataResponseSchema,
} from "./storefront-api.schema";
import {
  type storefrontProgramSchema,
  type createStorefrontProgramSchema,
  type updateStorefrontProgramSchema,
} from "./storefront.schema";

export type StorefrontProgram = z.infer<typeof storefrontProgramSchema>;

export type CreateStorefrontProgramData = z.infer<typeof createStorefrontProgramSchema>;

export type UpdateStorefrontProgramData = z.infer<typeof updateStorefrontProgramSchema>;

export type StorefrontProgramsStats = z.infer<typeof getStorefrontProgramStatsResponseSchema>;

export type AdminStorefrontProgramsPageData = z.infer<
  typeof getStorefrontProgramsPageDataResponseSchema
>;
