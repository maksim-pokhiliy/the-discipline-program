import { AppError, ConflictError } from "@repo/errors";
import { logger } from "@repo/shared";

import { getMonitoring } from "../monitoring";
import { getUserId } from "../request-context";
import type { AuthenticatedHandler, RouteContext, RouteHandler } from "../types";

import { IDEMPOTENCY_HEADER_REQUEST, IDEMPOTENCY_TTL_SECONDS } from "./constants";
import { getIdempotencyStore } from "./idempotency-store-registry";
import type { CachedResponse, IdempotencyLookupResult, IdempotencyStorePort } from "./port";
import { type IdempotencyBodyMode, captureBody, redactScope, validateKey } from "./request-codec";
import { sha256Hex } from "./request-fingerprint";
import { buildAuthScope, buildCanonicalRoute, buildPublicScope } from "./request-route";
import { annotateLive, cloneResponseForCache, replayResponse } from "./response-codec";

export type { IdempotencyBodyMode };

export type IdempotencyConfig = {
  bodyMode: IdempotencyBodyMode;
};

type Run = (request: Request, context: RouteContext) => Promise<Response>;
type AuthRun = (request: Request, context: RouteContext, userId: string) => Promise<Response>;

const resolvePublicOrAuthScope = (request: Request): string => {
  const userId = getUserId();

  return userId ? buildAuthScope(userId) : buildPublicScope(request);
};

const freezeContext = (context: RouteContext, params: Record<string, string>): RouteContext => ({
  ...context,
  params: Promise.resolve(params),
});

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

const tryPersist = async (
  store: IdempotencyStorePort,
  ctx: StoreContext,
  cached: CachedResponse,
): Promise<CachedResponse | null> => {
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

      return persistResult.cached;
    }

    return null;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    getMonitoring()?.captureException(error, {
      tags: { component: "idempotency-store" },
      level: "warning",
    });
    logger.warn("idempotency.persist_failed", { route: ctx.route, scope: redactScope(ctx.scope) });

    return null;
  }
};

const persistAndFinalize = async (
  store: IdempotencyStorePort,
  ctx: StoreContext,
  liveResponse: Response,
): Promise<Response> => {
  const cached = await cloneResponseForCache(liveResponse);

  if (!cached) {
    logger.warn("idempotency.cache_skipped_non_json", {
      route: ctx.route,
      scope: redactScope(ctx.scope),
    });

    return annotateLive(liveResponse);
  }

  const racedCached = await tryPersist(store, ctx, cached);

  if (racedCached) {
    return replayResponse(racedCached);
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
  const method = request.method.toUpperCase();
  const route = buildCanonicalRoute(method, request, params);

  if (!key) {
    logger.info("idempotency.no_key", { route });

    return run(request, freezeContext(context, params));
  }

  const store = getIdempotencyStore();

  if (!store) {
    return annotateLive(await run(request, freezeContext(context, params)));
  }

  const { rebuiltRequest, fingerprint } = await captureBody(request, config.bodyMode);
  const storeCtx: StoreContext = { key, scope, route, method, fingerprint };

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
    const scope = resolvePublicOrAuthScope(request);

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
