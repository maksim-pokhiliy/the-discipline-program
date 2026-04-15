import {
  type AppError,
  ConflictError,
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

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 1_000;
const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);

type RequestOptions = {
  cache?: RequestCache;
};

type ApiClientConfig = {
  baseUrl: string;
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  credentials?: RequestCredentials;
  onUnauthorized?: () => never;
  timeoutMs?: number;
  maxRetries?: number;
  cache?: RequestCache;
};

export class ApiClient {
  private baseUrl: string;
  private getHeadersFn?: ApiClientConfig["getHeaders"];
  private credentials?: RequestCredentials;
  private onUnauthorized?: () => never;
  private timeoutMs: number;
  private maxRetries: number;
  private cache: RequestCache;

  constructor({
    baseUrl,
    getHeaders,
    credentials,
    onUnauthorized,
    timeoutMs,
    maxRetries,
    cache,
  }: ApiClientConfig) {
    this.baseUrl = baseUrl;
    this.getHeadersFn = getHeaders;
    this.credentials = credentials;
    this.onUnauthorized = onUnauthorized;
    this.timeoutMs = timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = maxRetries ?? DEFAULT_MAX_RETRIES;
    this.cache = cache ?? "no-store";
  }

  async request<T>(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
    body?: unknown,
    queryParams?: Record<string, string>,
    options?: RequestOptions,
  ): Promise<T> {
    const isFormData = body instanceof FormData;
    const dynamicHeaders = this.getHeadersFn ? await this.getHeadersFn() : {};
    const headers: Record<string, string> = { ...dynamicHeaders };

    let fullUrl = `${this.baseUrl}${url}`;

    if (body && !isFormData) {
      headers["Content-Type"] = "application/json";
    }

    if (queryParams) {
      const params = new URLSearchParams(queryParams).toString();

      if (params) {
        fullUrl += `?${params}`;
      }
    }

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay =
          BASE_RETRY_DELAY_MS * 2 ** (attempt - 1) + Math.random() * BASE_RETRY_DELAY_MS;

        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      let response: Response;

      try {
        response = await fetch(fullUrl, {
          method,
          headers,
          body: isFormData ? body : body ? JSON.stringify(body) : undefined,
          cache: options?.cache ?? this.cache,
          credentials: this.credentials,
          signal: controller.signal,
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          lastError = new TimeoutError(`Request timed out after ${this.timeoutMs}ms`, {
            url: fullUrl,
            timeoutMs: this.timeoutMs,
          });

          if (attempt < this.maxRetries) {
            continue;
          }

          throw lastError;
        }

        if (error instanceof TypeError && attempt < this.maxRetries) {
          lastError = error;
          continue;
        }

        throw error;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        if (response.status === 401 && this.onUnauthorized) {
          this.onUnauthorized();
        }

        if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < this.maxRetries) {
          continue;
        }

        const errBody = await response
          .json()
          .catch(() => ({ error: { message: `Request failed: ${response.status}` } }));

        const message = errBody.error?.message || "API request failed";
        const details = { status: response.status, url: fullUrl, ...errBody.error?.details };

        const ErrorClass = HTTP_STATUS_ERROR_MAP[response.status] ?? InternalServerError;

        throw new ErrorClass(message, details);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return response.json().catch(() => {
        throw new InternalServerError("Failed to parse API response", {
          status: response.status,
          url: fullUrl,
        });
      });
    }

    throw lastError;
  }
}
