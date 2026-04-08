import { z } from "zod";

import { CONTACT_CONSTANTS } from "./contact.constants";

export const createContactSubmissionSchema = z.object({
  name: z.string().min(1, "Name is required").max(CONTACT_CONSTANTS.MAX_NAME_LENGTH),
  contact: z
    .string()
    .min(1, "Phone, Telegram, or other contact is required")
    .max(CONTACT_CONSTANTS.MAX_CONTACT_LENGTH),
  program: z.string().max(CONTACT_CONSTANTS.MAX_PROGRAM_LENGTH).optional(),
  message: z.string().min(1, "Message is required").max(CONTACT_CONSTANTS.MAX_MESSAGE_LENGTH),
});
