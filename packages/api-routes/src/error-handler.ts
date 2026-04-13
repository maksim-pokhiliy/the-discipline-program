import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { baseEnv } from "@repo/env/base";
import { AppError, ERROR_CODES, ValidationError } from "@repo/errors";
import { logger } from "@repo/shared";

const REDACTED_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "creditcard",
  "ssn",
]);

const redactSensitiveFields = (obj: unknown, visited = new WeakSet<object>()): unknown => {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }

  if (visited.has(obj)) {
    return "[Circular]";
  }

  visited.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveFields(item, visited));
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = redactSensitiveFields(value, visited);
    }
  }

  return result;
};

export const handleApiError = (error: unknown): NextResponse => {
  unstable_rethrow(error);

  const safeError =
    error instanceof AppError
      ? { message: error.message, code: error.code, details: redactSensitiveFields(error.details) }
      : error instanceof Error
        ? { message: error.message }
        : { message: String(error) };

  logger.error("API Error", safeError);

  const isDev = baseEnv.NODE_ENV === "development";

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(isDev && error.details && { details: error.details }),
          ...(isDev && { stack: error.stack }),
        },
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    const validationError = new ValidationError("Validation failed", {
      issues: error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      })),
    });

    return NextResponse.json(
      {
        error: {
          code: validationError.code,
          message: validationError.message,
          ...(isDev && validationError.details && { details: validationError.details }),
        },
      },
      { status: 400 },
    );
  }

  const stack = error instanceof Error ? error.stack : undefined;

  return NextResponse.json(
    {
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
        ...(isDev && { stack }),
      },
    },
    { status: 500 },
  );
};
