import { type ErrorCode, ERROR_CODES } from "./error-codes";

type AppErrorOptions = {
  code?: ErrorCode;
  statusCode?: number;
  details?: Record<string, unknown> | undefined;
  cause?: Error;
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown> | undefined;
  public readonly timestamp: string;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);

    this.name = this.constructor.name;
    this.code = options.code || ERROR_CODES.INTERNAL_SERVER_ERROR;
    this.statusCode = options.statusCode || 500;
    this.details = options.details;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace?.(this, this.constructor);
  }
}
