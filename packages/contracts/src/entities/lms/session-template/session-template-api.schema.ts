import { z } from "zod";

import { libraryScopeSchema } from "../_domain/library-scope.schema";
import { sessionTemplatePayloadSchema } from "../_domain/template-payload.schema";

import { SESSION_TEMPLATE_CONSTANTS } from "./session-template.constants";
import { sessionTemplateSchema } from "./session-template.schema";

export const createSessionTemplateInputSchema = z.object({
  scope: libraryScopeSchema.default("COACH"),
  ownerId: z.string().cuid().nullable().optional(),
  name: z.string().min(1).max(SESSION_TEMPLATE_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().max(SESSION_TEMPLATE_CONSTANTS.MAX_DESCRIPTION_LENGTH).optional(),
  payload: sessionTemplatePayloadSchema,
});

export const updateSessionTemplateInputSchema = z.object({
  name: z.string().min(1).max(SESSION_TEMPLATE_CONSTANTS.MAX_NAME_LENGTH).optional(),
  description: z
    .string()
    .max(SESSION_TEMPLATE_CONSTANTS.MAX_DESCRIPTION_LENGTH)
    .nullable()
    .optional(),
  payload: sessionTemplatePayloadSchema.optional(),
  scope: libraryScopeSchema.optional(),
  ownerId: z.string().cuid().nullable().optional(),
});

export const sessionTemplateIdParamSchema = z.object({
  sessionTemplateId: z.string().cuid(),
});

export const listSessionTemplatesQuerySchema = z.object({
  scope: libraryScopeSchema.optional(),
  ownerId: z.string().cuid().optional(),
  search: z.string().min(1).max(100).optional(),
  includeDeleted: z.boolean().optional(),
  take: z.coerce.number().int().min(1).max(500).optional(),
});

export const listSessionTemplatesResponseSchema = z.object({
  items: z.array(sessionTemplateSchema),
  total: z.number().int().nonnegative(),
});

export const getSessionTemplateResponseSchema = sessionTemplateSchema;
export const createSessionTemplateResponseSchema = sessionTemplateSchema;
export const updateSessionTemplateResponseSchema = sessionTemplateSchema;

export const promoteSessionTemplateResponseSchema = sessionTemplateSchema;
export const demoteSessionTemplateInputSchema = z.object({ newOwnerId: z.string().cuid() });
export const demoteSessionTemplateResponseSchema = sessionTemplateSchema;
