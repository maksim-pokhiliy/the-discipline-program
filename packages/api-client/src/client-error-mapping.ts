import {
  type AppError,
  BadRequestError,
  ConflictError,
  ERROR_CODES,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  ServiceUnavailableError,
  TimeoutError,
  TooManyRequestsError,
  UnauthorizedError,
  ValidationError,
} from "@repo/errors";

type AppErrorConstructor = new (message: string, details?: Record<string, unknown>) => AppError;

const HTTP_STATUS_ERROR_MAP: Partial<Record<number, AppErrorConstructor>> = {
  400: ValidationError,
  401: UnauthorizedError,
  403: ForbiddenError,
  404: NotFoundError,
  409: ConflictError,
  422: ValidationError,
  429: TooManyRequestsError,
  502: ServiceUnavailableError,
  503: ServiceUnavailableError,
  504: ServiceUnavailableError,
};

const ERROR_CODE_TO_CLASS: Partial<Record<string, AppErrorConstructor>> = {
  [ERROR_CODES.VALIDATION_ERROR]: ValidationError,
  [ERROR_CODES.INVALID_INPUT]: BadRequestError,
  [ERROR_CODES.NOT_FOUND]: NotFoundError,
  [ERROR_CODES.UNAUTHORIZED]: UnauthorizedError,
  [ERROR_CODES.FORBIDDEN]: ForbiddenError,
  [ERROR_CODES.ALREADY_EXISTS]: ConflictError,
  [ERROR_CODES.TOO_MANY_REQUESTS]: TooManyRequestsError,
  [ERROR_CODES.TIMEOUT]: TimeoutError,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: ServiceUnavailableError,
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: InternalServerError,
};

type ApiErrorBody = {
  message?: unknown;
  code?: unknown;
  issues?: unknown;
  details?: unknown;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const extractErrorData = (errBody: unknown): ApiErrorBody => {
  if (!isObjectRecord(errBody) || !isObjectRecord(errBody.error)) {
    return {};
  }

  return errBody.error;
};

const extractServerDetails = (details: unknown): Record<string, unknown> => {
  if (!isObjectRecord(details)) {
    return {};
  }

  return details;
};

export const parseErrorResponse = async (
  response: Response,
  fullUrl: string,
): Promise<AppError> => {
  const errBody = await response
    .json()
    .catch(() => ({ error: { message: `Request failed: ${response.status}` } }));

  const errorData = extractErrorData(errBody);

  const message = typeof errorData.message === "string" ? errorData.message : "API request failed";
  const code = typeof errorData.code === "string" ? errorData.code : undefined;
  const issues = Array.isArray(errorData.issues) ? errorData.issues : undefined;
  const serverDetails = extractServerDetails(errorData.details);

  const details = {
    status: response.status,
    url: fullUrl,
    ...(code && { code }),
    ...(issues && { issues }),
    ...serverDetails,
  };

  const ErrorClass =
    (code ? ERROR_CODE_TO_CLASS[code] : undefined) ??
    HTTP_STATUS_ERROR_MAP[response.status] ??
    InternalServerError;

  return new ErrorClass(message, details);
};
