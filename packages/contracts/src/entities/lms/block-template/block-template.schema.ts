import { z } from "zod";

import { libraryScopeSchema } from "../_domain/library-scope.schema";
import { blockTemplatePayloadSchema } from "../_domain/template-payload.schema";

import { BLOCK_TEMPLATE_CONSTANTS } from "./block-template.constants";

export const blockTemplateSchema = z.object({
  id: z.string().cuid(),
  scope: libraryScopeSchema,
  ownerId: z.string().cuid().nullable(),
  name: z.string().min(1).max(BLOCK_TEMPLATE_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().max(BLOCK_TEMPLATE_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullable(),
  payload: blockTemplatePayloadSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});
