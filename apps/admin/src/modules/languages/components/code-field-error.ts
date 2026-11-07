import { ConflictError, ValidationError } from "@repo/errors";
import { getIssues } from "@repo/query";

const DUPLICATE_CODE_MESSAGE = "A language with this code already exists";

export const codeFieldErrorOf = (error: unknown): string | null => {
  if (error instanceof ConflictError && error.details?.field === "code") {
    return DUPLICATE_CODE_MESSAGE;
  }

  if (error instanceof ValidationError) {
    return getIssues(error)?.find((issue) => issue.path === "code")?.message ?? null;
  }

  return null;
};
