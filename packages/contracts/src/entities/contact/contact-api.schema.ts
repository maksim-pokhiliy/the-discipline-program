import { z } from "zod";

import { createContactSubmissionSchema } from "./contact.schema";

export const createContactSubmissionRequestSchema = createContactSubmissionSchema;

export const createContactSubmissionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const getContactSubmissionsResponseSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    program: z.string().optional(),
    message: z.string(),
    status: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);
