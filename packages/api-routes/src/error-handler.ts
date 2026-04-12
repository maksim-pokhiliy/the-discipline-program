import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { baseEnv } from "@repo/env/base";
import { AppError, ERROR_CODES, ValidationError } from "@repo/errors";

const REDACTED_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "creditcard",
  "ssn",
]);

const redactSensitiveFields = (obj: unknown): unknown => {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveFields);
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = redactSensitiveFields(value);
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

  console.error("API Error:", safeError);

  const isDev = baseEnv.NODE_ENV === "development";

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        ...(isDev && { details: error.details }),
        timestamp: error.timestamp,
        ...(isDev && { stack: error.stack }),
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
        error: validationError.message,
        code: validationError.code,
        statusCode: validationError.statusCode,
        ...(isDev && { details: validationError.details }),
        timestamp: validationError.timestamp,
      },
      { status: 400 },
    );
  }

  const stack = error instanceof Error ? error.stack : undefined;

  return NextResponse.json(
    {
      error: "Internal server error",
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      ...(isDev && { stack }),
    },
    { status: 500 },
  );
};
