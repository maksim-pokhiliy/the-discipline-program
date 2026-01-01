import { z } from "zod";

export const contactSubmissionSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  program: z.string().max(100).optional(),
  message: z.string().min(1).max(2000),
  status: z.enum(["NEW", "IN_PROGRESS", "REPLIED", "CLOSED"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createContactSubmissionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  program: z.string().max(100).optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});
