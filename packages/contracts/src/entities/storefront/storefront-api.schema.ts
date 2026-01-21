import { z } from "zod";

import {
  createStorefrontProgramSchema,
  updateStorefrontProgramSchema,
  storefrontProgramSchema,
} from "./storefront.schema";

export const getStorefrontProgramsResponseSchema = z.array(storefrontProgramSchema);

export const getStorefrontProgramByIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const createStorefrontProgramRequestSchema = createStorefrontProgramSchema;

export const updateStorefrontProgramParamsSchema = z.object({
  id: z.string().cuid(),
});

export const updateStorefrontProgramRequestSchema = updateStorefrontProgramSchema;

export const deleteStorefrontProgramParamsSchema = z.object({
  id: z.string().cuid(),
});

export const toggleStorefrontProgramStatusParamsSchema = z.object({
  id: z.string().cuid(),
});

export const getStorefrontProgramStatsResponseSchema = z.object({
  total: z.number(),
  active: z.number(),
  inactive: z.number(),
});

export const getStorefrontProgramsPageDataResponseSchema = z.object({
  stats: getStorefrontProgramStatsResponseSchema,
  programs: getStorefrontProgramsResponseSchema,
});
