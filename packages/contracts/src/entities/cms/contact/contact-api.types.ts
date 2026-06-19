import { type z } from "zod";

import {
  type createContactSubmissionRequestSchema,
  type createContactSubmissionResponseSchema,
  type createLeadSubmissionRequestSchema,
  type createLeadSubmissionResponseSchema,
  type getContactSubmissionsResponseSchema,
  type getContactByIdParamsSchema,
  type getContactByIdResponseSchema,
  type updateContactParamsSchema,
  type updateContactRequestSchema,
  type deleteContactParamsSchema,
  type getContactsPageDataResponseSchema,
} from "./contact-api.schema";
import { type contactSubmissionItemSchema } from "./contact.schema";

export type ContactSubmissionItem = z.infer<typeof contactSubmissionItemSchema>;

export type CreateContactSubmissionRequest = z.infer<typeof createContactSubmissionRequestSchema>;

export type CreateContactSubmissionResponse = z.infer<typeof createContactSubmissionResponseSchema>;

export type CreateLeadSubmissionRequest = z.infer<typeof createLeadSubmissionRequestSchema>;

export type CreateLeadSubmissionResponse = z.infer<typeof createLeadSubmissionResponseSchema>;

export type GetContactSubmissionsResponse = z.infer<typeof getContactSubmissionsResponseSchema>;

export type GetContactByIdParams = z.infer<typeof getContactByIdParamsSchema>;

export type GetContactByIdResponse = z.infer<typeof getContactByIdResponseSchema>;

export type UpdateContactParams = z.infer<typeof updateContactParamsSchema>;

export type UpdateContactRequest = z.infer<typeof updateContactRequestSchema>;

export type DeleteContactParams = z.infer<typeof deleteContactParamsSchema>;

export type AdminContactsPageData = z.infer<typeof getContactsPageDataResponseSchema>;
