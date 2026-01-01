import { z } from "zod";
import { contactSubmissionSchema, createContactSubmissionSchema } from "./contact.schema";

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;
export type CreateContactSubmissionData = z.infer<typeof createContactSubmissionSchema>;

export type ContactStatus = "NEW" | "IN_PROGRESS" | "REPLIED" | "CLOSED";
