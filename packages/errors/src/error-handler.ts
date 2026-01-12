import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { env } from "@repo/env";

import { AppError } from "./app-error";
import { ERROR_CODES } from "./error-codes";
import { ValidationError } from "./http-errors";

export interface ErrorResponse {
  error: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
  timestamp: string;
  stack?: string;
}

export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        timestamp: error.timestamp,
        ...(env.NODE_ENV === "development" && { stack: error.stack }),
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
        details: validationError.details,
        timestamp: validationError.timestamp,
      },
      { status: 400 },
    );
  }

  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as { code: string; meta?: Record<string, unknown> };

    if (prismaError.code === "P2002") {
      return NextResponse.json(
        {
          error: "Resource already exists",
          code: ERROR_CODES.DUPLICATE_ENTRY,
          statusCode: 409,
          details: prismaError.meta,
          timestamp: new Date().toISOString(),
        },
        { status: 409 },
      );
    }

    if (prismaError.code === "P2003") {
      return NextResponse.json(
        {
          error: "Invalid reference",
          code: ERROR_CODES.FOREIGN_KEY_CONSTRAINT_VIOLATION,
          statusCode: 400,
          details: prismaError.meta,
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    if (prismaError.code === "P2025") {
      return NextResponse.json(
        {
          error: "Resource not found",
          code: ERROR_CODES.NOT_FOUND,
          statusCode: 404,
          details: prismaError.meta,
          timestamp: new Date().toISOString(),
        },
        { status: 404 },
      );
    }
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  const stack = error instanceof Error ? error.stack : undefined;

  return NextResponse.json(
    {
      error: message,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      ...(env.NODE_ENV === "development" && { stack }),
    },
    { status: 500 },
  );
}
