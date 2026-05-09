export const DEFAULT_ERROR_MESSAGE = "Save failed";

export const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
