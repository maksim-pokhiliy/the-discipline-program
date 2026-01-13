import { z } from "zod";

import { createProgramSchema, updateProgramSchema, programSchema } from "./program.schema";

export const getProgramsResponseSchema = z.array(programSchema);

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

export const getProgramStatsResponseSchema = z.object({
  total: z.number(),
  active: z.number(),
  inactive: z.number(),
});

export const getProgramsPageDataResponseSchema = z.object({
  stats: getProgramStatsResponseSchema,
  programs: getProgramsResponseSchema,
});
