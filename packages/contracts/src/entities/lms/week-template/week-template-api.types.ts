import { type z } from "zod";

import {
  type createWeekTemplateInputSchema,
  type createWeekTemplateResponseSchema,
  type demoteWeekTemplateInputSchema,
  type demoteWeekTemplateResponseSchema,
  type getWeekTemplateResponseSchema,
  type listWeekTemplatesQuerySchema,
  type listWeekTemplatesResponseSchema,
  type promoteWeekTemplateResponseSchema,
  type weekTemplateIdParamSchema,
  type updateWeekTemplateInputSchema,
  type updateWeekTemplateResponseSchema,
} from "./week-template-api.schema";

export type CreateWeekTemplateInput = z.infer<typeof createWeekTemplateInputSchema>;
export type UpdateWeekTemplateInput = z.infer<typeof updateWeekTemplateInputSchema>;
export type WeekTemplateIdParam = z.infer<typeof weekTemplateIdParamSchema>;
export type ListWeekTemplatesQuery = z.infer<typeof listWeekTemplatesQuerySchema>;
export type ListWeekTemplatesResponse = z.infer<typeof listWeekTemplatesResponseSchema>;
export type GetWeekTemplateResponse = z.infer<typeof getWeekTemplateResponseSchema>;
export type CreateWeekTemplateResponse = z.infer<typeof createWeekTemplateResponseSchema>;
export type UpdateWeekTemplateResponse = z.infer<typeof updateWeekTemplateResponseSchema>;
export type PromoteWeekTemplateResponse = z.infer<typeof promoteWeekTemplateResponseSchema>;
export type DemoteWeekTemplateInput = z.infer<typeof demoteWeekTemplateInputSchema>;
export type DemoteWeekTemplateResponse = z.infer<typeof demoteWeekTemplateResponseSchema>;
