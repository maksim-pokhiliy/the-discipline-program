import { z } from "zod";

import { libraryScopeSchema } from "../_domain/library-scope.schema";
import { weekTemplatePayloadSchema } from "../_domain/template-payload.schema";

import { WEEK_TEMPLATE_CONSTANTS } from "./week-template.constants";

export const weekTemplateSchema = z.object({
  id: z.string().cuid(),
  scope: libraryScopeSchema,
  ownerId: z.string().cuid().nullable(),
  name: z.string().min(1).max(WEEK_TEMPLATE_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().max(WEEK_TEMPLATE_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullable(),
  payload: weekTemplatePayloadSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});
