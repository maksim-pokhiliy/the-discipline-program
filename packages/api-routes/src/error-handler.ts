import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError, ERROR_CODES } from "@repo/errors";
import { logger, redactPii } from "@repo/shared";

import { getMonitoring } from "./monitoring";

const buildHeaders = (requestId: string | undefined): Headers | undefined =>
  requestId ? new Headers({ "x-request-id": requestId }) : undefined;

const summarizeError = (error: unknown): Record<string, unknown> => {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: redactPii(error.details),
    };
  }

  if (error instanceof ZodError) {
    return {
      message: "Validation failed",
      code: ERROR_CODES.VALIDATION_ERROR,
      issues: error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
        code: e.code,
      })),
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: String(error) };
};

const isClientError = (error: unknown): boolean =>
  error instanceof AppError && error.statusCode < 500;

const reportError = (
  error: unknown,
  safeError: Record<string, unknown>,
  requestId: string | undefined,
): void => {
  const payload = { ...safeError, ...(requestId && { requestId }) };

  if (isClientError(error)) {
    logger.warn("API client error", payload);

    return;
  }

  logger.error("API Error", payload);

  const monitoring = getMonitoring();

  if (!monitoring) {
    return;
  }

  monitoring.captureException(error, {
    tags: { requestId: requestId ?? "unknown" },
    extra: safeError,
    level: "error",
  });
};

const appErrorResponse = (error: AppError, requestId: string | undefined): NextResponse => {
  const headers = buildHeaders(requestId) ?? new Headers();

  if (
    (error.statusCode === 429 || error.statusCode === 503) &&
    typeof error.details?.retryAfter === "number"
  ) {
    headers.set("Retry-After", String(error.details.retryAfter));
  }

  const isClient = error.statusCode < 500;
  const issues =
    isClient && Array.isArray(error.details?.issues) ? error.details.issues : undefined;
  const otherDetails =
    isClient && error.details
      ? redactPii(
          Object.fromEntries(Object.entries(error.details).filter(([key]) => key !== "issues")),
        )
      : undefined;

  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(issues && { issues }),
        ...(otherDetails && Object.keys(otherDetails).length > 0 && { details: otherDetails }),
      },
    },
    { status: error.statusCode, headers },
  );
};

const unknownErrorResponse = (requestId: string | undefined): NextResponse => {
  const headers = buildHeaders(requestId);

  return NextResponse.json(
    {
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
      },
    },
    { status: 500, ...(headers && { headers }) },
  );
};

export const handleApiError = (error: unknown, requestId?: string): NextResponse => {
  unstable_rethrow(error);

  reportError(error, summarizeError(error), requestId);

  if (error instanceof AppError) {
    return appErrorResponse(error, requestId);
  }

  return unknownErrorResponse(requestId);
};
