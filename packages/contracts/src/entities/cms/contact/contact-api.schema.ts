import { z } from "zod";

import { idParamSchema } from "../../../common";

import { CONTACT_CONSTANTS, ContactStatus } from "./contact.constants";
import { contactSubmissionItemSchema, createContactSubmissionSchema } from "./contact.schema";

export const createContactSubmissionRequestSchema = createContactSubmissionSchema;

export const createContactSubmissionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const getContactSubmissionsResponseSchema = z.array(contactSubmissionItemSchema);

export const getContactByIdParamsSchema = idParamSchema;

export const getContactByIdResponseSchema = contactSubmissionItemSchema;

export const updateContactParamsSchema = idParamSchema;

export const updateContactRequestSchema = z.object({
  status: z.nativeEnum(ContactStatus).optional(),
  notes: z.string().max(CONTACT_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const deleteContactParamsSchema = idParamSchema;

export const getContactsPageDataResponseSchema = z.object({
  contacts: getContactSubmissionsResponseSchema,
});
