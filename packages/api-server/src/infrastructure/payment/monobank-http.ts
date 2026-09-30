import { BadGatewayError, InternalServerError, TimeoutError } from "@repo/errors";

import { errorBodySchema, type MonobankPath } from "./monobank-wire";

const ATTEMPT_TIMEOUT_MS = 10_000;
const READ_RETRIES = 2;
const BACKOFF_BASE_MS = 1_000;
const BACKOFF_FACTOR = 2;
const TOO_MANY_REQUESTS_STATUS = 429;
const SERVER_ERROR_STATUS_FLOOR = 500;
const SUCCESS_STATUS_FLOOR = 200;
const SUCCESS_STATUS_CEILING = 300;
const REDACTED = "[REDACTED]";

const MERCHANT_TOKEN_HEADER = "X-Token";
const CONTENT_TYPE_HEADER = "Content-Type";
const JSON_CONTENT_TYPE = "application/json";
const TRAILING_SLASHES = /\/+$/;
const TIMEOUT_ERROR_NAMES: ReadonlySet<string> = new Set(["AbortError", "TimeoutError"]);

const REJECTED_MESSAGE = "monobank rejected the request";
const FAILED_MESSAGE = "monobank failed the request";
const UNREACHABLE_MESSAGE = "monobank could not be reached";
const TIMEOUT_MESSAGE = "monobank did not answer in time";

type MonobankHttpConfig = {
  apiUrl: string;
  merchantToken: string;
  fetch?: typeof fetch | undefined;
};

type MonobankCall =
  | {
      method: "GET";
      path: MonobankPath;
      query?: Record<string, string> | undefined;
      secrets?: readonly string[] | undefined;
    }
  | {
      method: "POST";
      path: MonobankPath;
      body: unknown;
      secrets?: readonly string[] | undefined;
    }
  | {
      method: "DELETE";
      path: MonobankPath;
      query: Record<string, string>;
      secrets?: readonly string[] | undefined;
    };

export type MonobankHttp = {
  send: (call: MonobankCall) => Promise<string>;
};

type Reply = {
  kind: "reply";
  status: number;
  body: string;
};

type Attempt = Reply | { kind: "timeout" } | { kind: "unreachable" };

type ErrorBody = {
  errCode: string | null;
  errText: string | null;
};

const buildUrl = (apiUrl: string, call: MonobankCall): string => {
  const url = `${apiUrl.replace(TRAILING_SLASHES, "")}${call.path}`;
  const search = new URLSearchParams(call.method === "POST" ? undefined : call.query).toString();

  return search === "" ? url : `${url}?${search}`;
};

const buildInit = (call: MonobankCall, merchantToken: string, signal: AbortSignal): RequestInit => {
  const init: RequestInit = { method: call.method, cache: "no-store", redirect: "error", signal };

  if (call.method !== "POST") {
    return { ...init, headers: { [MERCHANT_TOKEN_HEADER]: merchantToken } };
  }

  return {
    ...init,
    headers: { [MERCHANT_TOKEN_HEADER]: merchantToken, [CONTENT_TYPE_HEADER]: JSON_CONTENT_TYPE },
    body: JSON.stringify(call.body),
  };
};

const isTimeoutError = (error: unknown): boolean =>
  error instanceof Error && TIMEOUT_ERROR_NAMES.has(error.name);

const attemptOnce = async (
  doFetch: typeof fetch,
  url: string,
  toInit: (signal: AbortSignal) => RequestInit,
): Promise<Attempt> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

  try {
    const response = await doFetch(url, toInit(controller.signal));

    return { kind: "reply", status: response.status, body: await response.text() };
  } catch (error) {
    return isTimeoutError(error) ? { kind: "timeout" } : { kind: "unreachable" };
  } finally {
    clearTimeout(timer);
  }
};

const isRetryable = (attempt: Attempt): boolean =>
  attempt.kind !== "reply" ||
  attempt.status === TOO_MANY_REQUESTS_STATUS ||
  attempt.status >= SERVER_ERROR_STATUS_FLOOR;

const backoffDelayMs = (retry: number): number =>
  BACKOFF_BASE_MS * BACKOFF_FACTOR ** (retry - 1) + Math.random() * BACKOFF_BASE_MS;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const formsOf = (secret: string): string[] => {
  const queryForm = new URLSearchParams([["", secret]]).toString().slice(1);

  return queryForm === secret ? [secret] : [secret, queryForm];
};

const scrub = (text: string, secrets: readonly string[]): string =>
  secrets
    .filter((secret) => secret !== "")
    .flatMap(formsOf)
    .reduce((scrubbed, form) => scrubbed.replaceAll(form, REDACTED), text);

const parseErrorJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const readErrorBody = (reply: Reply, secrets: readonly string[]): ErrorBody => {
  const parsed = errorBodySchema.safeParse(parseErrorJson(reply.body));

  if (!parsed.success) {
    return { errCode: null, errText: null };
  }

  return {
    errCode: scrub(parsed.data.errCode, secrets),
    errText: scrub(parsed.data.errText, secrets),
  };
};

const settle = (attempt: Attempt, path: MonobankPath, secrets: readonly string[]): string => {
  if (attempt.kind === "timeout") {
    throw new TimeoutError(TIMEOUT_MESSAGE, { path, timeoutMs: ATTEMPT_TIMEOUT_MS });
  }

  if (attempt.kind === "unreachable") {
    throw new BadGatewayError(UNREACHABLE_MESSAGE, { path });
  }

  if (attempt.status >= SUCCESS_STATUS_FLOOR && attempt.status < SUCCESS_STATUS_CEILING) {
    return attempt.body;
  }

  const details = { path, status: attempt.status, ...readErrorBody(attempt, secrets) };

  if (isRetryable(attempt)) {
    throw new BadGatewayError(FAILED_MESSAGE, details);
  }

  throw new InternalServerError(REJECTED_MESSAGE, details);
};

export const createMonobankHttp = (config: MonobankHttpConfig): MonobankHttp => {
  const send = async (call: MonobankCall): Promise<string> => {
    const doFetch = config.fetch ?? globalThis.fetch;
    const url = buildUrl(config.apiUrl, call);
    const toInit = (signal: AbortSignal): RequestInit =>
      buildInit(call, config.merchantToken, signal);
    const retries = call.method === "GET" ? READ_RETRIES : 0;
    let attempt = await attemptOnce(doFetch, url, toInit);

    for (let retry = 1; retry <= retries && isRetryable(attempt); retry++) {
      await sleep(backoffDelayMs(retry));
      attempt = await attemptOnce(doFetch, url, toInit);
    }

    return settle(attempt, call.path, [config.merchantToken, ...(call.secrets ?? [])]);
  };

  return { send };
};
