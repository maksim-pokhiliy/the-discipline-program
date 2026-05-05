import { z } from "zod";

import { idParamSchema } from "../../../common";

import {
  createSchemeTypeSchema,
  schemeTypeSchema,
  updateSchemeTypeSchema,
} from "./scheme-type.schema";

export const getSchemeTypesResponseSchema = z.array(schemeTypeSchema);

export const getSchemeTypeByIdParamsSchema = idParamSchema;

export const getSchemeTypeResponseSchema = schemeTypeSchema;

export const createSchemeTypeRequestSchema = createSchemeTypeSchema;

export const createSchemeTypeResponseSchema = schemeTypeSchema;

export const updateSchemeTypeParamsSchema = idParamSchema;

export const updateSchemeTypeRequestSchema = updateSchemeTypeSchema;

export const updateSchemeTypeResponseSchema = schemeTypeSchema;

export const deleteSchemeTypeParamsSchema = idParamSchema;

export const getSchemeTypesPageDataResponseSchema = z.object({
  schemeTypes: getSchemeTypesResponseSchema,
});
