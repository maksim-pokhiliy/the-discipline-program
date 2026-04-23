import { type z } from "zod";

import {
  type createSchemeRequestSchema,
  type createSchemeResponseSchema,
  type deleteSchemeParamsSchema,
  type getSchemeByIdParamsSchema,
  type getSchemeResponseSchema,
  type getSchemesQuerySchema,
  type getSchemesResponseSchema,
  type updateSchemeParamsSchema,
  type updateSchemeRequestSchema,
  type updateSchemeResponseSchema,
} from "./scheme-api.schema";

export type GetSchemesQuery = z.infer<typeof getSchemesQuerySchema>;
export type GetSchemesResponse = z.infer<typeof getSchemesResponseSchema>;
export type GetSchemeByIdParams = z.infer<typeof getSchemeByIdParamsSchema>;
export type GetSchemeResponse = z.infer<typeof getSchemeResponseSchema>;
export type CreateSchemeRequest = z.infer<typeof createSchemeRequestSchema>;
export type CreateSchemeResponse = z.infer<typeof createSchemeResponseSchema>;
export type UpdateSchemeParams = z.infer<typeof updateSchemeParamsSchema>;
export type UpdateSchemeRequest = z.infer<typeof updateSchemeRequestSchema>;
export type UpdateSchemeResponse = z.infer<typeof updateSchemeResponseSchema>;
export type DeleteSchemeParams = z.infer<typeof deleteSchemeParamsSchema>;
