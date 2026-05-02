import { type ZodType, type ZodTypeDef } from "zod";

export type ResponseSchema<T> = ZodType<T, ZodTypeDef, unknown>;

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type RequestOptions = {
  cache?: RequestCache;
  idempotencyKey?: string;
};

export type TypedRequestOptions<T> = RequestOptions & {
  responseSchema?: ResponseSchema<T>;
};

export type ApiClientConfig = {
  baseUrl: string;
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  credentials?: RequestCredentials | undefined;
  onUnauthorized?: (() => never) | undefined;
  timeoutMs?: number;
  maxRetries?: number;
  maxTotalDurationMs?: number;
  cache?: RequestCache;
};

export type PreparedRequest = {
  fullUrl: string;
  headers: Record<string, string>;
  body: BodyInit | undefined;
  cache: RequestCache | undefined;
};
