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
    name: z.string(),
    email: z.string(),
    program: z.string().optional(),
    message: z.string(),
    status: z.enum(["NEW", "IN_PROGRESS", "REPLIED", "CLOSED"]),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);
