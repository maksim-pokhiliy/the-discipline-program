import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError, ERROR_CODES } from "@repo/errors";
import { logger } from "@repo/shared";

import { getMonitoring } from "./monitoring";

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

export const handleApiError = (error: unknown, requestId?: string): NextResponse => {
  unstable_rethrow(error);

  const safeError =
    error instanceof AppError
      ? { message: error.message, code: error.code, details: redactSensitiveFields(error.details) }
      : error instanceof ZodError
        ? {
            message: "Validation failed",
            code: ERROR_CODES.VALIDATION_ERROR,
            issues: error.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
              code: e.code,
            })),
          }
        : error instanceof Error
          ? { message: error.message }
          : { message: String(error) };

  logger.error("API Error", { ...safeError, ...(requestId && { requestId }) });

  const monitoring = getMonitoring();

  if (monitoring) {
    monitoring.captureException(error, {
      tags: { requestId: requestId ?? "unknown" },
      extra: safeError as Record<string, unknown>,
      level: error instanceof AppError && error.statusCode < 500 ? "warning" : "error",
    });
  }

  const headers = requestId ? { "x-request-id": requestId } : undefined;

  if (error instanceof AppError) {
    const appErrorHeaders = new Headers(headers);

    if (error.statusCode === 429 && typeof error.details?.retryAfter === "number") {
      appErrorHeaders.set("Retry-After", String(error.details.retryAfter));
    }

    const redactedDetails = error.details
      ? (redactSensitiveFields(error.details) as Record<string, unknown>)
      : undefined;

    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(redactedDetails &&
            Object.keys(redactedDetails).length > 0 && { details: redactedDetails }),
        },
      },
      { status: error.statusCode, headers: appErrorHeaders },
    );
  }

  if (error instanceof ZodError) {
    const issues = error.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
      code: e.code,
    }));

    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Validation failed",
          issues,
        },
      },
      { status: 400, headers },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
      },
    },
    { status: 500, headers },
  );
};
