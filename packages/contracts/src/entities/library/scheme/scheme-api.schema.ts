import { z } from "zod";

import { schemeIdParamSchema } from "../../../common";

import { createSchemeSchema, schemeSchema, updateSchemeSchema } from "./scheme.schema";

export const getSchemesQuerySchema = z.object({
  includeInactive: z.coerce.boolean().optional(),
});

export const getSchemesResponseSchema = z.array(schemeSchema);

export const getSchemeByIdParamsSchema = schemeIdParamSchema;

export const getSchemeResponseSchema = schemeSchema;

export const createSchemeRequestSchema = createSchemeSchema;

export const createSchemeResponseSchema = schemeSchema;

export const updateSchemeParamsSchema = schemeIdParamSchema;

export const updateSchemeRequestSchema = updateSchemeSchema;

export const updateSchemeResponseSchema = schemeSchema;

export const deleteSchemeParamsSchema = schemeIdParamSchema;
