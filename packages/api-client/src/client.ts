import { InternalServerError } from "@repo/errors";

import { parseErrorResponse } from "./client-error-mapping";
import { parseSuccessBody } from "./client-response";
import {
  RETRYABLE_STATUS_CODES,
  buildRetryBudgetExhaustedError,
  classifyTransportError,
  computeBackoffDelay,
  sleep,
} from "./client-retry";
import type {
  ApiClientConfig,
  HttpMethod,
  PreparedRequest,
  RequestOptions,
  TypedRequestOptions,
} from "./client-types";

export type {
  ApiClientConfig,
  HttpMethod,
  RequestOptions,
  TypedRequestOptions,
} from "./client-types";
export { type ResponseSchema } from "./client-types";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_MAX_TOTAL_DURATION_MS = 15_000;
const NO_CONTENT_STATUS = 204;
const UNAUTHORIZED_STATUS = 401;
const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

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
    options?: TypedRequestOptions<T>,
  ): Promise<T> {
    const prepared = await this.prepareRequest(url, method, body, queryParams, options);
    const response = await this.executeRequest(prepared, method);

    if (response.status === NO_CONTENT_STATUS) {
      throw new InternalServerError("Unexpected 204 No Content for typed request", {
        status: response.status,
        url: prepared.fullUrl,
      });
    }

    return parseSuccessBody<T>(response, prepared.fullUrl, options?.responseSchema);
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

  private async fetchWithTimeout(
    prepared: PreparedRequest,
    method: HttpMethod,
    attemptTimeoutMs: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), attemptTimeoutMs);

    try {
      return await fetch(prepared.fullUrl, {
        method,
        headers: prepared.headers,
        ...(prepared.body !== undefined && { body: prepared.body }),
        ...(prepared.cache !== undefined && { cache: prepared.cache }),
        ...(this.credentials !== undefined && { credentials: this.credentials }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private resolveAttemptTimeout(startedAt: number): number {
    const remainingBudgetMs = this.maxTotalDurationMs - (Date.now() - startedAt);

    return Math.max(0, Math.min(this.timeoutMs, remainingBudgetMs));
  }

  private async runOneAttempt(
    prepared: PreparedRequest,
    method: HttpMethod,
    attempt: number,
    attemptTimeoutMs: number,
  ): Promise<{ kind: "success"; response: Response } | { kind: "retry"; error: unknown }> {
    let response: Response;

    try {
      response = await this.fetchWithTimeout(prepared, method, attemptTimeoutMs);
    } catch (error) {
      const outcome = classifyTransportError(
        error,
        prepared.fullUrl,
        attempt,
        this.maxRetries,
        this.timeoutMs,
      );

      if (outcome.kind === "retry") {
        return { kind: "retry", error: outcome.error };
      }

      throw outcome.error;
    }

    if (response.ok) {
      return { kind: "success", response };
    }

    if (response.status === UNAUTHORIZED_STATUS && this.onUnauthorized) {
      this.onUnauthorized();
    }

    if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < this.maxRetries) {
      return { kind: "retry", error: undefined };
    }

    throw await parseErrorResponse(response, prepared.fullUrl);
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
            buildRetryBudgetExhaustedError(prepared.fullUrl, this.maxTotalDurationMs, elapsedMs)
          );
        }

        await sleep(computeBackoffDelay(attempt));
      }

      const attemptTimeoutMs = this.resolveAttemptTimeout(startedAt);

      if (attemptTimeoutMs <= 0) {
        throw (
          lastError ?? buildRetryBudgetExhaustedError(prepared.fullUrl, this.maxTotalDurationMs)
        );
      }

      const outcome = await this.runOneAttempt(prepared, method, attempt, attemptTimeoutMs);

      if (outcome.kind === "success") {
        return outcome.response;
      }

      if (outcome.error !== undefined) {
        lastError = outcome.error;
      }
    }

    throw lastError ?? new InternalServerError("Request retry loop exited without resolution");
  }
}
