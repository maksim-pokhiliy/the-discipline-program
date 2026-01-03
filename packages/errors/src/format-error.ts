import { AppError } from "./app-error";

export interface FormattedError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export function formatError(error: unknown): FormattedError {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    if ("error" in error && typeof (error as Record<string, unknown>).error === "object") {
      const apiError = (error as Record<string, unknown>).error as {
        message?: string;
        code?: string;
        details?: Record<string, unknown>;
      };

      return {
        message: apiError.message || error.message,
        code: apiError.code,
        details: apiError.details,
      };
    }

    return {
      message: error.message,
    };
  }

  return {
    message: "An unexpected error occurred",
  };
}

export function getErrorMessage(error: unknown): string {
  return formatError(error).message;
}
