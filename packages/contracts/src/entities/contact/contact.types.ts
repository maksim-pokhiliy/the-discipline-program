import { type z } from "zod";

import { type createContactSubmissionSchema } from "./contact.schema";

export type CreateContactSubmission = z.infer<typeof createContactSubmissionSchema>;
