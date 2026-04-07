import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { baseEnv } from "@repo/env/base";
import { AppError, ERROR_CODES, ValidationError } from "@repo/errors";

export const handleApiError = (error: unknown): NextResponse => {
  console.error("API Error:", error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        timestamp: error.timestamp,
        ...(baseEnv.NODE_ENV === "development" && { stack: error.stack }),
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

  const message = error instanceof Error ? error.message : "Internal server error";
  const stack = error instanceof Error ? error.stack : undefined;

  return NextResponse.json(
    {
      error: message,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      ...(baseEnv.NODE_ENV === "development" && { stack }),
    },
    { status: 500 },
  );
};
