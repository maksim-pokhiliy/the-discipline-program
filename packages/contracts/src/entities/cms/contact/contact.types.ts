import { type z } from "zod";

import {
  type contactSubmissionItemSchema,
  type createContactSubmissionSchema,
  type createLeadSubmissionSchema,
} from "./contact.schema";

export type ContactSubmission = z.infer<typeof contactSubmissionItemSchema>;

export type CreateContactSubmission = z.infer<typeof createContactSubmissionSchema>;

export type CreateLeadSubmission = z.infer<typeof createLeadSubmissionSchema>;
