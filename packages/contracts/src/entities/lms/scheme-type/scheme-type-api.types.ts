import { type z } from "zod";

import {
  type createSchemeTypeRequestSchema,
  type createSchemeTypeResponseSchema,
  type deleteSchemeTypeParamsSchema,
  type getSchemeTypeByIdParamsSchema,
  type getSchemeTypeResponseSchema,
  type getSchemeTypesPageDataResponseSchema,
  type getSchemeTypesResponseSchema,
  type updateSchemeTypeParamsSchema,
  type updateSchemeTypeRequestSchema,
  type updateSchemeTypeResponseSchema,
} from "./scheme-type-api.schema";

export type GetSchemeTypesResponse = z.infer<typeof getSchemeTypesResponseSchema>;

export type GetSchemeTypeByIdParams = z.infer<typeof getSchemeTypeByIdParamsSchema>;

export type GetSchemeTypeResponse = z.infer<typeof getSchemeTypeResponseSchema>;

export type CreateSchemeTypeRequest = z.infer<typeof createSchemeTypeRequestSchema>;

export type CreateSchemeTypeResponse = z.infer<typeof createSchemeTypeResponseSchema>;

export type UpdateSchemeTypeParams = z.infer<typeof updateSchemeTypeParamsSchema>;

export type UpdateSchemeTypeRequest = z.infer<typeof updateSchemeTypeRequestSchema>;

export type UpdateSchemeTypeResponse = z.infer<typeof updateSchemeTypeResponseSchema>;

export type DeleteSchemeTypeParams = z.infer<typeof deleteSchemeTypeParamsSchema>;

export type GetSchemeTypesPageDataResponse = z.infer<typeof getSchemeTypesPageDataResponseSchema>;

export type AdminSchemeTypesPageData = GetSchemeTypesPageDataResponse;
