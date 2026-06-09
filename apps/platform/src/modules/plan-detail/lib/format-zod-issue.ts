import type { ZodIssue } from "zod";

const PATH_SEPARATOR = ".";

export const formatZodIssue = (issue: ZodIssue): string =>
  issue.path.length > 0 ? `${issue.path.join(PATH_SEPARATOR)}: ${issue.message}` : issue.message;
