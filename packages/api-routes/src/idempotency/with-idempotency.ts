import { BadRequestError, ConflictError } from "@repo/errors";
import { logger } from "@repo/shared";

import { getMonitoring } from "../monitoring";
import type { AuthenticatedHandler, RouteContext, RouteHandler } from "../types";

import {
  IDEMPOTENCY_HEADER_CREATED_AT,
  IDEMPOTENCY_HEADER_REPLAYED,
  IDEMPOTENCY_HEADER_REQUEST,
  IDEMPOTENCY_KEY_MAX_LENGTH,
  IDEMPOTENCY_KEY_REGEX,
  IDEMPOTENCY_TTL_SECONDS,
  REPLAYABLE_RESPONSE_HEADERS,
} from "./constants";
import { getIdempotencyStore } from "./idempotency-store-registry";
import type { CachedResponse, IdempotencyLookupResult, IdempotencyStorePort } from "./port";
import { fingerprintFormData, fingerprintRawBody, sha256Hex } from "./request-fingerprint";
import { buildAuthScope, buildCanonicalRoute, buildPublicScope } from "./request-route";

export type IdempotencyBodyMode = "json" | "formdata" | "none";

export type IdempotencyConfig = {
  method: string;
  bodyMode: IdempotencyBodyMode;
};

type Run = (request: Request, context: RouteContext) => Promise<Response>;
type AuthRun = (request: Request, context: RouteContext, userId: string) => Promise<Response>;

const validateKey = (raw: string | null): string | null => {
  if (!raw) {
    return null;
  }

  const first = raw.split(",", 1)[0]?.trim() ?? "";

  if (!first) {
    return null;
  }

  if (first.length > IDEMPOTENCY_KEY_MAX_LENGTH || !IDEMPOTENCY_KEY_REGEX.test(first)) {
    throw new BadRequestError("Idempotency-Key header malformed", {
      length: first.length,
      keyHash: sha256Hex(first).slice(0, 12),
    });
  }

  return first;
};

const captureBody = async (
  request: Request,
  mode: IdempotencyBodyMode,
): Promise<{ rebuiltRequest: Request; fingerprint: string }> => {
  if (mode === "none") {
    return { rebuiltRequest: request, fingerprint: sha256Hex("") };
  }

  if (mode === "formdata") {
    const form = await request.formData();
    const fingerprint = await fingerprintFormData(form);
    const headers = new Headers(request.headers);

    headers.delete("content-type");

    const rebuiltRequest = new Request(request.url, {
      method: request.method,
      headers,
      body: form,
    });

    return { rebuiltRequest, fingerprint };
  }

  const text = await request.text();
  const fingerprint = fingerprintRawBody(text);
  const rebuiltRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: text,
  });

  return { rebuiltRequest, fingerprint };
};

const cloneResponseForCache = async (response: Response): Promise<CachedResponse> => {
  const clone = response.clone();
  const bodyText = clone.status === 204 ? null : await clone.text();
  const body: unknown = bodyText ? JSON.parse(bodyText) : null;
  const headers: Record<string, string> = {};

  for (const [name, value] of clone.headers.entries()) {
    if (REPLAYABLE_RESPONSE_HEADERS.has(name.toLowerCase())) {
      headers[name] = value;
    }
  }

  return { status: clone.status, body, headers, createdAt: new Date() };
};

const replayResponse = (cached: CachedResponse): Response => {
  const headers = new Headers(cached.headers);

  headers.set(IDEMPOTENCY_HEADER_REPLAYED, "true");
  headers.set(IDEMPOTENCY_HEADER_CREATED_AT, cached.createdAt.toISOString());

  if (cached.status === 204) {
    return new Response(null, { status: 204, headers });
  }

  return new Response(JSON.stringify(cached.body), {
    status: cached.status,
    headers: { ...Object.fromEntries(headers.entries()), "content-type": "application/json" },
  });
};

const annotateLive = (response: Response): Response => {
  response.headers.set(IDEMPOTENCY_HEADER_REPLAYED, "false");

  return response;
};

const freezeContext = (context: RouteContext, params: Record<string, string>): RouteContext => ({
  ...context,
  params: Promise.resolve(params),
});

const redactScope = (scope: string): string => {
  const colonIdx = scope.indexOf(":");

  if (colonIdx === -1) {
    return scope;
  }

  const kind = scope.slice(0, colonIdx);
  const value = scope.slice(colonIdx + 1);

  if (kind === "user" && value) {
    return `user:${sha256Hex(value).slice(0, 12)}`;
  }

  return scope;
};

type StoreContext = {
  key: string;
  scope: string;
  route: string;
  method: string;
  fingerprint: string;
};

const dispatchLookup = (lookup: IdempotencyLookupResult, ctx: StoreContext): Response | null => {
  if (lookup.kind === "replay") {
    logger.info("idempotency.replay", { route: ctx.route, scope: redactScope(ctx.scope) });

    return replayResponse(lookup.cached);
  }

  if (lookup.kind === "mismatch") {
    logger.warn("idempotency.mismatch", { route: ctx.route, scope: redactScope(ctx.scope) });

    throw new ConflictError("Idempotency-Key reuse with different request body", {
      keyHash: sha256Hex(ctx.key).slice(0, 12),
    });
  }

  return null;
};

const persistAndFinalize = async (
  store: IdempotencyStorePort,
  ctx: StoreContext,
  liveResponse: Response,
): Promise<Response> => {
  const cached = await cloneResponseForCache(liveResponse);

  try {
    const persistResult = await store.persist({
      key: ctx.key,
      scope: ctx.scope,
      route: ctx.route,
      method: ctx.method,
      requestFingerprint: ctx.fingerprint,
      response: cached,
      ttlSeconds: IDEMPOTENCY_TTL_SECONDS,
    });

    if (persistResult.status === "raced") {
      logger.info("idempotency.race_resolved", {
        route: ctx.route,
        scope: redactScope(ctx.scope),
      });

      return replayResponse(persistResult.cached);
    }
  } catch (error) {
    getMonitoring()?.captureException(error, {
      tags: { component: "idempotency-store" },
      level: "warning",
    });
    logger.warn("idempotency.persist_failed", { route: ctx.route, scope: redactScope(ctx.scope) });
  }

  return annotateLive(liveResponse);
};

type RunIdempotentArgs = {
  run: Run;
  config: IdempotencyConfig;
  request: Request;
  context: RouteContext;
  params: Record<string, string>;
  scope: string;
};

const runIdempotent = async (args: RunIdempotentArgs): Promise<Response> => {
  const { run, config, request, context, params, scope } = args;
  const key = validateKey(request.headers.get(IDEMPOTENCY_HEADER_REQUEST));
  const route = buildCanonicalRoute(config.method, request, params);

  if (!key) {
    logger.info("idempotency.no_key", { route });

    return run(request, freezeContext(context, params));
  }

  const store = getIdempotencyStore();

  if (!store) {
    return annotateLive(await run(request, freezeContext(context, params)));
  }

  const { rebuiltRequest, fingerprint } = await captureBody(request, config.bodyMode);
  const storeCtx: StoreContext = { key, scope, route, method: config.method, fingerprint };

  let lookup: IdempotencyLookupResult;

  try {
    lookup = await store.lookup({ key, scope, route, requestFingerprint: fingerprint });
  } catch (error) {
    getMonitoring()?.captureException(error, {
      tags: { component: "idempotency-store" },
      level: "warning",
    });
    logger.warn("idempotency.lookup_failed", { route, scope: redactScope(scope) });

    return annotateLive(await run(rebuiltRequest, freezeContext(context, params)));
  }

  const dispatched = dispatchLookup(lookup, storeCtx);

  if (dispatched) {
    return dispatched;
  }

  const liveResponse = await run(rebuiltRequest, freezeContext(context, params));

  return persistAndFinalize(store, storeCtx, liveResponse);
};

export const wrapHandler =
  (run: Run, config: IdempotencyConfig): RouteHandler =>
  async (request, context) => {
    const params = await context.params;
    const scope = buildPublicScope(request);

    return runIdempotent({ run, config, request, context, params, scope });
  };

export const wrapAuthHandler =
  (run: AuthRun, config: IdempotencyConfig): AuthenticatedHandler =>
  async (request, context, userId) => {
    const params = await context.params;
    const scope = buildAuthScope(userId);

    return runIdempotent({
      run: (req, ctx) => run(req, ctx, userId),
      config,
      request,
      context,
      params,
      scope,
    });
  };
