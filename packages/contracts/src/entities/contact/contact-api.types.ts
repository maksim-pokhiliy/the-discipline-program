import { type z } from "zod";

import {
  type createContactSubmissionRequestSchema,
  type createContactSubmissionResponseSchema,
  type getContactSubmissionsResponseSchema,
} from "./contact-api.schema";

export type CreateContactSubmissionRequest = z.infer<typeof createContactSubmissionRequestSchema>;

export type CreateContactSubmissionResponse = z.infer<typeof createContactSubmissionResponseSchema>;

export type GetContactSubmissionsResponse = z.infer<typeof getContactSubmissionsResponseSchema>;
