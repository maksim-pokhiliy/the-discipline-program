import { z } from "zod";

export const apiErrorIssueSchema = z.object({
  path: z.string(),
  message: z.string(),
  code: z.string().optional(),
});

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
    issues: z.array(apiErrorIssueSchema).optional(),
  }),
});

export type ApiErrorIssue = z.infer<typeof apiErrorIssueSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
