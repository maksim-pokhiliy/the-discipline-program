import { z } from "zod";
import {
  createProgramSchema,
  updateProgramSchema,
  updateProgramsOrderSchema,
} from "./program.schema";

export const getProgramsResponseSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    price: z.number(),
    currency: z.string(),
    features: z.array(z.string()),
    isActive: z.boolean(),
    sortOrder: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);

export const getProgramByIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const createProgramRequestSchema = createProgramSchema;

export const updateProgramParamsSchema = z.object({
  id: z.string().cuid(),
});
export const updateProgramRequestSchema = updateProgramSchema;

export const deleteProgramParamsSchema = z.object({
  id: z.string().cuid(),
});

export const toggleProgramStatusParamsSchema = z.object({
  id: z.string().cuid(),
});

export const updateProgramsOrderRequestSchema = updateProgramsOrderSchema;

export const getProgramStatsResponseSchema = z.object({
  total: z.number(),
  active: z.number(),
  inactive: z.number(),
});

export const getProgramsPageDataResponseSchema = z.object({
  stats: getProgramStatsResponseSchema,
  programs: getProgramsResponseSchema,
});
