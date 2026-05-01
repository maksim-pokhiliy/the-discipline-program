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

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 1;
const DEFAULT_MAX_TOTAL_DURATION_MS = 8_000;
const BASE_RETRY_DELAY_MS = 1_000;
const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);
const NO_CONTENT_STATUS = 204;
const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type RequestOptions = {
  cache?: RequestCache;
  idempotencyKey?: string;
};

type ApiClientConfig = {
  baseUrl: string;
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  credentials?: RequestCredentials | undefined;
  onUnauthorized?: (() => never) | undefined;
  timeoutMs?: number;
  maxRetries?: number;
  maxTotalDurationMs?: number;
  cache?: RequestCache;
};

type PreparedRequest = {
  fullUrl: string;
  headers: Record<string, string>;
  body: BodyInit | undefined;
  cache: RequestCache | undefined;
};

type ApiErrorBody = {
  message?: unknown;
  code?: unknown;
  issues?: unknown;
  details?: unknown;
};

export class ApiClient {
  private baseUrl: string;
  private getHeadersFn?: ApiClientConfig["getHeaders"];
  private credentials?: RequestCredentials | undefined;
  private onUnauthorized?: (() => never) | undefined;
  private timeoutMs: number;
  private maxRetries: number;
  private maxTotalDurationMs: number;
  private cache: RequestCache | undefined;

  constructor({
    baseUrl,
    getHeaders,
    credentials,
    onUnauthorized,
    timeoutMs,
    maxRetries,
    maxTotalDurationMs,
    cache,
  }: ApiClientConfig) {
    this.baseUrl = baseUrl;
    this.getHeadersFn = getHeaders;
    this.credentials = credentials;
    this.onUnauthorized = onUnauthorized;
    this.timeoutMs = timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = maxRetries ?? DEFAULT_MAX_RETRIES;
    this.maxTotalDurationMs = maxTotalDurationMs ?? DEFAULT_MAX_TOTAL_DURATION_MS;
    this.cache = cache;
  }

  async request<T>(
    url: string,
    method: HttpMethod = "GET",
    body?: unknown,
    queryParams?: Record<string, string>,
    options?: RequestOptions,
  ): Promise<T> {
    const prepared = await this.prepareRequest(url, method, body, queryParams, options);
    const response = await this.executeRequest(prepared, method);

    if (response.status === NO_CONTENT_STATUS) {
      throw new InternalServerError("Unexpected 204 No Content for typed request", {
        status: response.status,
        url: prepared.fullUrl,
      });
    }

    return this.parseSuccessBody<T>(response, prepared.fullUrl);
  }

  async requestNoContent(
    url: string,
    method: HttpMethod = "DELETE",
    body?: unknown,
    queryParams?: Record<string, string>,
    options?: RequestOptions,
  ): Promise<void> {
    const prepared = await this.prepareRequest(url, method, body, queryParams, options);

    await this.executeRequest(prepared, method);
  }

  private async prepareRequest(
    url: string,
    method: HttpMethod,
    body: unknown,
    queryParams: Record<string, string> | undefined,
    options: RequestOptions | undefined,
  ): Promise<PreparedRequest> {
    const dynamicHeaders = this.getHeadersFn ? await this.getHeadersFn() : {};
    const headers: Record<string, string> = { ...dynamicHeaders };

    if (body !== undefined && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (!IDEMPOTENT_METHODS.has(method)) {
      headers["Idempotency-Key"] = options?.idempotencyKey ?? crypto.randomUUID();
    }

    let fullUrl = `${this.baseUrl}${url}`;

    if (queryParams) {
      const params = new URLSearchParams(queryParams).toString();

      if (params) {
        fullUrl += `?${params}`;
      }
    }

    return {
      fullUrl,
      headers,
      body: this.buildBody(body),
      cache: options?.cache ?? this.cache,
    };
  }

  private buildBody(body: unknown): BodyInit | undefined {
    if (body === undefined) {
      return undefined;
    }

    if (body instanceof FormData) {
      return body;
    }

    return JSON.stringify(body);
  }

  private async executeRequest(prepared: PreparedRequest, method: HttpMethod): Promise<Response> {
    let lastError: unknown;
    const startedAt = Date.now();

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const elapsedMs = Date.now() - startedAt;

      if (attempt > 0) {
        if (elapsedMs >= this.maxTotalDurationMs) {
          throw (
            lastError ??
            new InternalServerError("Request retry budget exhausted", {
              url: prepared.fullUrl,
              elapsedMs,
              maxTotalDurationMs: this.maxTotalDurationMs,
            })
          );
        }

        const delay =
          BASE_RETRY_DELAY_MS * 2 ** (attempt - 1) + Math.random() * BASE_RETRY_DELAY_MS;

        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const remainingBudgetMs = this.maxTotalDurationMs - (Date.now() - startedAt);
      const attemptTimeoutMs = Math.max(0, Math.min(this.timeoutMs, remainingBudgetMs));

      if (attemptTimeoutMs <= 0) {
        throw (
          lastError ??
          new InternalServerError("Request retry budget exhausted", {
            url: prepared.fullUrl,
            maxTotalDurationMs: this.maxTotalDurationMs,
          })
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), attemptTimeoutMs);

      let response: Response;

      try {
        response = await fetch(prepared.fullUrl, {
          method,
          headers: prepared.headers,
          ...(prepared.body !== undefined && { body: prepared.body }),
          ...(prepared.cache !== undefined && { cache: prepared.cache }),
          ...(this.credentials !== undefined && { credentials: this.credentials }),
          signal: controller.signal,
        });
      } catch (error) {
        const transientError = this.handleTransportError(error, prepared.fullUrl, attempt);

        if (transientError) {
          lastError = transientError;
          continue;
        }

        throw error;
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        return response;
      }

      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
      }

      if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < this.maxRetries) {
        continue;
      }

      throw await this.parseErrorResponse(response, prepared.fullUrl);
    }

    throw lastError ?? new InternalServerError("Request retry loop exited without resolution");
  }

  private handleTransportError(error: unknown, fullUrl: string, attempt: number): Error | null {
    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError = new TimeoutError(`Request timed out after ${this.timeoutMs}ms`, {
        url: fullUrl,
        timeoutMs: this.timeoutMs,
      });

      if (attempt < this.maxRetries) {
        return timeoutError;
      }

      throw timeoutError;
    }

    if (error instanceof TypeError && attempt < this.maxRetries) {
      return error;
    }

    return null;
  }

  private async parseErrorResponse(response: Response, fullUrl: string): Promise<AppError> {
    const errBody = await response
      .json()
      .catch(() => ({ error: { message: `Request failed: ${response.status}` } }));

    const errorData: ApiErrorBody =
      typeof errBody === "object" && errBody !== null && "error" in errBody
        ? ((errBody as { error: ApiErrorBody }).error ?? {})
        : {};

    const message =
      typeof errorData.message === "string" ? errorData.message : "API request failed";
    const code = typeof errorData.code === "string" ? errorData.code : undefined;
    const issues = Array.isArray(errorData.issues) ? errorData.issues : undefined;
    const serverDetails =
      typeof errorData.details === "object" && errorData.details !== null
        ? (errorData.details as Record<string, unknown>)
        : {};
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
  }

  private async parseSuccessBody<T>(response: Response, fullUrl: string): Promise<T> {
    try {
      return (await response.json()) as T;
    } catch {
      throw new InternalServerError("Failed to parse API response", {
        status: response.status,
        url: fullUrl,
      });
    }
  }
}
