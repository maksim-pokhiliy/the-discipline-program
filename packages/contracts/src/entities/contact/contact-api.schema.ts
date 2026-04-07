import { z } from "zod";

import { ContactStatus } from "./contact.constants";
import { createContactSubmissionSchema } from "./contact.schema";

export const createContactSubmissionRequestSchema = createContactSubmissionSchema;

export const createContactSubmissionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const contactSubmissionItemSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  contact: z.string().nullable(),
  program: z.string().nullable(),
  message: z.string(),
  status: z.string(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const getContactSubmissionsResponseSchema = z.array(contactSubmissionItemSchema);

export const getContactByIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const getContactByIdResponseSchema = contactSubmissionItemSchema;

export const updateContactParamsSchema = z.object({
  id: z.string().cuid(),
});

export const updateContactRequestSchema = z.object({
  status: z.nativeEnum(ContactStatus).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const deleteContactParamsSchema = z.object({
  id: z.string().cuid(),
});

export const getContactsPageDataResponseSchema = z.object({
  contacts: getContactSubmissionsResponseSchema,
});
