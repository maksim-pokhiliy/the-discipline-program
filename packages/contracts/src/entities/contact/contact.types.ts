import { type z } from "zod";

import { type contactSubmissionSchema, type createContactSubmissionSchema } from "./contact.schema";

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;

export type CreateContactSubmission = z.infer<typeof createContactSubmissionSchema>;
