import { type z } from "zod";

import {
  type contactSubmissionItemSchema,
  type createContactSubmissionSchema,
} from "./contact.schema";

export type ContactSubmission = z.infer<typeof contactSubmissionItemSchema>;

export type CreateContactSubmission = z.infer<typeof createContactSubmissionSchema>;
