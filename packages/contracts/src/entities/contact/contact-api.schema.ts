import { z } from "zod";

import { CONTACT_STATUSES } from "./contact.constants";
import { createContactSubmissionSchema } from "./contact.schema";

export const createContactSubmissionRequestSchema = createContactSubmissionSchema;

export const createContactSubmissionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

const contactSubmissionItemSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  program: z.string().nullable(),
  message: z.string(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const getContactSubmissionsResponseSchema = z.array(contactSubmissionItemSchema);

export const getContactByIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const getContactByIdResponseSchema = contactSubmissionItemSchema;

export const updateContactStatusParamsSchema = z.object({
  id: z.string().cuid(),
});

export const updateContactStatusRequestSchema = z.object({
  status: z.enum(CONTACT_STATUSES),
});

export const deleteContactParamsSchema = z.object({
  id: z.string().cuid(),
});

export const contactStatsSchema = z.object({
  total: z.number(),
  new: z.number(),
  inProgress: z.number(),
  replied: z.number(),
  closed: z.number(),
});

export const getContactsPageDataResponseSchema = z.object({
  stats: contactStatsSchema,
  contacts: getContactSubmissionsResponseSchema,
});
