import { type z } from "zod";

import {
  type getStorefrontProgramsResponseSchema,
  type getStorefrontProgramByIdParamsSchema,
  type createStorefrontProgramRequestSchema,
  type updateStorefrontProgramParamsSchema,
  type updateStorefrontProgramRequestSchema,
  type deleteStorefrontProgramParamsSchema,
  type toggleStorefrontProgramStatusParamsSchema,
  type getStorefrontProgramStatsResponseSchema,
  type getStorefrontProgramsPageDataResponseSchema,
} from "./storefront-api.schema";

export type GetStorefrontProgramsResponse = z.infer<typeof getStorefrontProgramsResponseSchema>;

export type GetStorefrontProgramByIdParams = z.infer<typeof getStorefrontProgramByIdParamsSchema>;

export type CreateStorefrontProgramRequest = z.infer<typeof createStorefrontProgramRequestSchema>;

export type UpdateStorefrontProgramParams = z.infer<typeof updateStorefrontProgramParamsSchema>;

export type UpdateStorefrontProgramRequest = z.infer<typeof updateStorefrontProgramRequestSchema>;

export type DeleteStorefrontProgramParams = z.infer<typeof deleteStorefrontProgramParamsSchema>;

export type ToggleStorefrontProgramStatusParams = z.infer<
  typeof toggleStorefrontProgramStatusParamsSchema
>;

export type GetStorefrontProgramStatsResponse = z.infer<
  typeof getStorefrontProgramStatsResponseSchema
>;

export type GetStorefrontProgramsPageDataResponse = z.infer<
  typeof getStorefrontProgramsPageDataResponseSchema
>;
