import { env } from "@repo/env";

import { type ErrorCode, ERROR_CODES } from "./error-codes";

export interface AppErrorOptions {
  code?: ErrorCode;
  statusCode?: number;
  details?: Record<string, unknown>;
  cause?: Error;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);

    this.name = this.constructor.name;
    this.code = options.code || ERROR_CODES.INTERNAL_SERVER_ERROR;
    this.statusCode = options.statusCode || 500;
    this.details = options.details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    if (options.cause) {
      this.cause = options.cause;
    }

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      ...(env.NODE_ENV === "development" && {
        stack: this.stack,
      }),
    };
  }
}
