import {
  type AppError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
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
};

interface ApiClientConfig {
  baseUrl: string;
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  credentials?: RequestCredentials;
  onUnauthorized?: () => never;
}

export class ApiClient {
  private baseUrl: string;
  private getHeadersFn?: ApiClientConfig["getHeaders"];
  private credentials?: RequestCredentials;
  private onUnauthorized?: () => never;

  constructor({ baseUrl, getHeaders, credentials, onUnauthorized }: ApiClientConfig) {
    this.baseUrl = baseUrl;
    this.getHeadersFn = getHeaders;
    this.credentials = credentials;
    this.onUnauthorized = onUnauthorized;
  }

  async request<T>(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
    body?: unknown,
    queryParams?: Record<string, string>,
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

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      credentials: this.credentials,
    });

    if (!response.ok) {
      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
      }

      const error = await response
        .json()
        .catch(() => ({ error: `Request failed: ${response.status}` }));

      const message = error.error || "API request failed";
      const details = { status: response.status, url: fullUrl, ...error.details };

      const ErrorClass = HTTP_STATUS_ERROR_MAP[response.status] ?? InternalServerError;

      throw new ErrorClass(message, details);
    }

    return response.json().catch(() => {
      throw new InternalServerError("Failed to parse API response", {
        status: response.status,
        url: fullUrl,
      });
    });
  }
}
