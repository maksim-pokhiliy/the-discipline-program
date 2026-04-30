import { z } from "zod";

import { libraryScopeSchema } from "../_domain/library-scope.schema";
import { sessionTemplatePayloadSchema } from "../_domain/template-payload.schema";

import { SESSION_TEMPLATE_CONSTANTS } from "./session-template.constants";

export const sessionTemplateSchema = z.object({
  id: z.string().cuid(),
  scope: libraryScopeSchema,
  ownerId: z.string().cuid().nullable(),
  name: z.string().min(1).max(SESSION_TEMPLATE_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().max(SESSION_TEMPLATE_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullable(),
  payload: sessionTemplatePayloadSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});
