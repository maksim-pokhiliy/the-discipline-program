import { z } from "zod";

import { libraryScopeSchema } from "../_domain/library-scope.schema";
import { weekTemplatePayloadSchema } from "../_domain/template-payload.schema";

import { WEEK_TEMPLATE_CONSTANTS } from "./week-template.constants";
import { weekTemplateSchema } from "./week-template.schema";

export const createWeekTemplateInputSchema = z.object({
  scope: libraryScopeSchema.default("COACH"),
  ownerId: z.string().cuid().nullable().optional(),
  name: z.string().min(1).max(WEEK_TEMPLATE_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().max(WEEK_TEMPLATE_CONSTANTS.MAX_DESCRIPTION_LENGTH).optional(),
  payload: weekTemplatePayloadSchema,
});

export const updateWeekTemplateInputSchema = z.object({
  name: z.string().min(1).max(WEEK_TEMPLATE_CONSTANTS.MAX_NAME_LENGTH).optional(),
  description: z.string().max(WEEK_TEMPLATE_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullable().optional(),
  payload: weekTemplatePayloadSchema.optional(),
  scope: libraryScopeSchema.optional(),
  ownerId: z.string().cuid().nullable().optional(),
});

export const weekTemplateIdParamSchema = z.object({
  weekTemplateId: z.string().cuid(),
});

export const listWeekTemplatesQuerySchema = z.object({
  scope: libraryScopeSchema.optional(),
  ownerId: z.string().cuid().optional(),
  search: z.string().min(1).max(100).optional(),
  includeDeleted: z.boolean().optional(),
  take: z.coerce.number().int().min(1).max(500).optional(),
});

export const listWeekTemplatesResponseSchema = z.object({
  items: z.array(weekTemplateSchema),
  total: z.number().int().nonnegative(),
});

export const getWeekTemplateResponseSchema = weekTemplateSchema;
export const createWeekTemplateResponseSchema = weekTemplateSchema;
export const updateWeekTemplateResponseSchema = weekTemplateSchema;

export const promoteWeekTemplateResponseSchema = weekTemplateSchema;
export const demoteWeekTemplateInputSchema = z.object({ newOwnerId: z.string().cuid() });
export const demoteWeekTemplateResponseSchema = weekTemplateSchema;
