import { type z } from "zod";

import {
  type createSchemeTemplateInputSchema,
  type createSchemeTemplateResponseSchema,
  type demoteSchemeTemplateInputSchema,
  type demoteSchemeTemplateResponseSchema,
  type getSchemeTemplateResponseSchema,
  type listSchemeTemplatesQuerySchema,
  type listSchemeTemplatesResponseSchema,
  type promoteSchemeTemplateInputSchema,
  type promoteSchemeTemplateResponseSchema,
  type schemeTemplateIdParamSchema,
  type updateSchemeTemplateInputSchema,
  type updateSchemeTemplateResponseSchema,
} from "./scheme-template-api.schema";

export type CreateSchemeTemplateInput = z.infer<typeof createSchemeTemplateInputSchema>;
export type UpdateSchemeTemplateInput = z.infer<typeof updateSchemeTemplateInputSchema>;
export type SchemeTemplateIdParam = z.infer<typeof schemeTemplateIdParamSchema>;
export type ListSchemeTemplatesQuery = z.infer<typeof listSchemeTemplatesQuerySchema>;
export type ListSchemeTemplatesResponse = z.infer<typeof listSchemeTemplatesResponseSchema>;
export type GetSchemeTemplateResponse = z.infer<typeof getSchemeTemplateResponseSchema>;
export type CreateSchemeTemplateResponse = z.infer<typeof createSchemeTemplateResponseSchema>;
export type UpdateSchemeTemplateResponse = z.infer<typeof updateSchemeTemplateResponseSchema>;
export type PromoteSchemeTemplateInput = z.infer<typeof promoteSchemeTemplateInputSchema>;
export type PromoteSchemeTemplateResponse = z.infer<typeof promoteSchemeTemplateResponseSchema>;
export type DemoteSchemeTemplateInput = z.infer<typeof demoteSchemeTemplateInputSchema>;
export type DemoteSchemeTemplateResponse = z.infer<typeof demoteSchemeTemplateResponseSchema>;
