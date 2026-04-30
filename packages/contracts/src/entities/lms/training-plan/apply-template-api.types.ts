import { type z } from "zod";

import {
  type applyBlockTemplateInputSchema,
  type applySessionTemplateInputSchema,
  type applyTemplateInputSchema,
  type applyTemplateParamsSchema,
  type applyTemplateResponseSchema,
  type applyWeekTemplateInputSchema,
} from "./apply-template-api.schema";

export type ApplyBlockTemplateInput = z.infer<typeof applyBlockTemplateInputSchema>;
export type ApplySessionTemplateInput = z.infer<typeof applySessionTemplateInputSchema>;
export type ApplyWeekTemplateInput = z.infer<typeof applyWeekTemplateInputSchema>;
export type ApplyTemplateInput = z.infer<typeof applyTemplateInputSchema>;
export type ApplyTemplateParams = z.infer<typeof applyTemplateParamsSchema>;
export type ApplyTemplateResponse = z.infer<typeof applyTemplateResponseSchema>;
