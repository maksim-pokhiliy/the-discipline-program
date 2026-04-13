import { AppError } from "./app-error";
import { ERROR_CODES } from "./error-codes";

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: Record<string, unknown>) {
    super(message, {
      code: ERROR_CODES.NOT_FOUND,
      statusCode: 404,
      details,
    });
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: Record<string, unknown>) {
    super(message, {
      code: ERROR_CODES.VALIDATION_ERROR,
      statusCode: 400,
      details,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: Record<string, unknown>) {
    super(message, {
      code: ERROR_CODES.UNAUTHORIZED,
      statusCode: 401,
      details,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: Record<string, unknown>) {
    super(message, {
      code: ERROR_CODES.FORBIDDEN,
      statusCode: 403,
      details,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists", details?: Record<string, unknown>) {
    super(message, {
      code: ERROR_CODES.ALREADY_EXISTS,
      statusCode: 409,
      details,
    });
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: Record<string, unknown>) {
    super(message, {
      code: ERROR_CODES.INVALID_INPUT,
      statusCode: 400,
      details,
    });
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests", details?: Record<string, unknown>) {
    super(message, {
      code: ERROR_CODES.TOO_MANY_REQUESTS,
      statusCode: 429,
      details,
    });
  }
}

export class TimeoutError extends AppError {
  constructor(message = "Request timed out", details?: Record<string, unknown>) {
    super(message, {
      code: ERROR_CODES.TIMEOUT,
      statusCode: 504,
      details,
    });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable", details?: Record<string, unknown>) {
    super(message, {
      code: ERROR_CODES.SERVICE_UNAVAILABLE,
      statusCode: 503,
      details,
    });
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error", details?: Record<string, unknown>) {
    super(message, {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      statusCode: 500,
      details,
    });
  }
}
