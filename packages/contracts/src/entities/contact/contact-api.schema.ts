import { z } from "zod";

import { CONTACT_STATUSES } from "./contact.constants";
import { createContactSubmissionSchema } from "./contact.schema";

export const createContactSubmissionRequestSchema = createContactSubmissionSchema;

export const createContactSubmissionResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .strict();

export const getContactSubmissionsResponseSchema = z.array(
  z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      program: z.string().optional(),
      message: z.string(),
      status: z.enum(CONTACT_STATUSES),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
    .strict(),
);
