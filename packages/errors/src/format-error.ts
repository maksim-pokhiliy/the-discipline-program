import { AppError } from "./app-error";

export interface FormattedError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export const formatError = (error: unknown): FormattedError => {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    if ("error" in error) {
      const nested = (error as Error & { error: unknown }).error;

      if (typeof nested === "object" && nested !== null) {
        const obj = nested as Record<string, unknown>;

        return {
          message: typeof obj.message === "string" ? obj.message : error.message,
          code: typeof obj.code === "string" ? obj.code : undefined,
          details:
            typeof obj.details === "object" && obj.details !== null
              ? (obj.details as Record<string, unknown>)
              : undefined,
        };
      }
    }

    return {
      message: error.message,
    };
  }

  return {
    message: "An unexpected error occurred",
  };
};

export const getErrorMessage = (error: unknown): string => formatError(error).message;
