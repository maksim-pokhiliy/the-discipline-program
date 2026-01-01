import { z } from "zod";
import {
  createContactSubmissionRequestSchema,
  createContactSubmissionResponseSchema,
  getContactSubmissionsResponseSchema,
} from "./contact-api.schema";

export type CreateContactSubmissionRequest = z.infer<typeof createContactSubmissionRequestSchema>;
export type CreateContactSubmissionResponse = z.infer<typeof createContactSubmissionResponseSchema>;
export type GetContactSubmissionsResponse = z.infer<typeof getContactSubmissionsResponseSchema>;
