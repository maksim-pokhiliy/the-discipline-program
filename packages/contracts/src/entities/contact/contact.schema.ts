import { z } from "zod";

import { CONTACT_STATUSES, CONTACT_CONSTANTS } from "./contact.constants";

export const contactSubmissionSchema = z
  .object({
    id: z.string().cuid(),
    name: z.string().min(1).max(CONTACT_CONSTANTS.MAX_NAME_LENGTH),
    email: z.string().email(),
    program: z.string().max(CONTACT_CONSTANTS.MAX_PROGRAM_LENGTH).optional(),
    message: z.string().min(1).max(CONTACT_CONSTANTS.MAX_MESSAGE_LENGTH),
    status: z.enum(CONTACT_STATUSES),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export const createContactSubmissionSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(CONTACT_CONSTANTS.MAX_NAME_LENGTH),
    email: z.string().email("Invalid email address"),
    program: z.string().max(CONTACT_CONSTANTS.MAX_PROGRAM_LENGTH).optional(),
    message: z
      .string()
      .min(CONTACT_CONSTANTS.MIN_MESSAGE_LENGTH, "Message must be at least 10 characters")
      .max(CONTACT_CONSTANTS.MAX_MESSAGE_LENGTH),
  })
  .strict();
