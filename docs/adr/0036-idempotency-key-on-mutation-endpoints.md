# 0036. Idempotency-Key support on every mutation endpoint

> **[SUPERSEDED — partial]** by ADR-0037 on 2026-05-03 — the LMS authoring mutation endpoints that this ADR covered (`bulk-patch`, `apply-template`, `duplicate`, library CRUD, plan-coach-assignments, plan-enrollments, plan-overrides) were deleted when the plan-editor / library / templates feature was rolled back. The factory-level `wrapHandler` / `wrapAuthHandler` infrastructure, the `RequestIdempotency` table, the `IdempotencyStorePort` + Prisma adapter, and the inbound / outbound header contract all remain in force for every surviving mutation endpoint (auth, billing, coaching dashboard, action items, athlete logs, CMS, contact). Coverage is structural at the factory, not opt-in, so new endpoints inherit it automatically.

- **Status:** Accepted (with known gaps — see Consequences)
- **Date:** 2026-05-01
- **Tags:** `api`, `reliability`, `factories`, `prisma`

## Context

An earlier resilience review (REL-003) flagged that every mutation route in the codebase ran through factories in `packages/api-routes/src/route-helpers.ts` and `packages/api-routes/src/auth-factories.ts`, none of which read `Idempotency-Key`. ADR 0020 and the project manifesto both require idempotency keys on writes; the codebase relied on _accidental_ DB-level idempotency (invite-token consume, optimistic-version bulk patch, advisory-locked reconcile) for a handful of flows and on nothing for the other 110+ mutation routes.

The client side (`packages/api-client/src/client.ts`) already attached `Idempotency-Key: <crypto.randomUUID()>` to every non-idempotent method as part of REL-001 hardening. The server simply ignored the header. A double-click submit, a flaky-mobile retry, or any 5xx-then-retry from `ApiClient` produced duplicate rows on every endpoint that wasn't already DB-idempotent.

The factories are a hard chokepoint — every mutation runs through one of 15 factories in those two files. Adding idempotency anywhere else (per-route, per-app) would have been opt-in and partial. The resolution was to extend the factories themselves.

## Decision

Server-side idempotency lives at the factory layer, default-on for every mutation factory.

- A new Prisma model `RequestIdempotency` (table `app_request_idempotency`) stores `(key, scope, route)`-keyed rows with the cached response status, body, and a whitelisted subset of response headers, plus a 24-hour `expiresAt`. The unique constraint is `(key, scope, route)` — same key in different user/IP scopes or on different routes is independent, which prevents cross-tenant replay.
- A port `IdempotencyStorePort` lives in `packages/api-routes/src/idempotency/`. The Prisma adapter `prismaIdempotencyStore` lives in `packages/api-server/src/idempotency/`. Each app calls `setIdempotencyStore(prismaIdempotencyStore)` at boot, mirroring how `setRateLimiter` is wired today.
- Two helpers — `wrapHandler` and `wrapAuthHandler` — are consumed _inside_ the existing factories. Public factory signatures are unchanged. The 113 mutation route call sites compile byte-identical and gain idempotency for free.
- HTTP method comes from `request.method` at run time, not from any factory-side `IdempotencyConfig`. There is exactly one source of truth, so a factory exporting `PATCH` (e.g. the toggle factories) is logged and persisted as `PATCH`, not as a stale `POST` declared at construction.
- Scope is derived server-side: `wrapAuthHandler` (used by `auth-factories.ts`) takes the userId from its `AuthenticatedHandler` signature. `wrapHandler` (used by base factories in `route-helpers.ts`) reads `userId` from the AsyncLocalStorage `request-context` populated by `bindIdentity` in the auth wrappers — admin/coach/athlete routes that compose `withAdminAuth(...createPostHandler(...))` therefore get `user:<userId>` scoping automatically. Only routes that ran without an auth wrapper (today: just `POST /api/public/contact`) fall back to `ip:<getClientIp(request)>`. The scope is never derived from a client header — cross-tenant replay is structurally impossible.
- Body fingerprint is `sha256` over a canonical input that combines the request URL pathname with the body digest (raw bytes for JSON, or, for multipart, a stable composition of sorted field names + byte lengths + per-field sha256). The pathname is included so that bodyless mutations on path-parameterized routes (`DELETE /api/x/[id]`) cannot collide across different concrete IDs even when the canonical `route` key normalizes them to the same template. Same key with a different fingerprint returns `409 Conflict`.
- TTL cleanup is lazy-only in v1: the lookup filters `expiresAt > now()`; expired rows linger until overwritten by a fresh `(key, scope, route)` upsert. No cron job introduced — the codebase has no existing crons and the projected v1 row volume (≈10⁴ steady-state) does not justify the operational primitive.

Header contract:

- Inbound: `Idempotency-Key: <key>` where the key matches `/^[A-Za-z0-9_-]{1,256}$/`. Empty/missing skips idempotency entirely. Multi-value (proxy-injected) takes the first value.
- Outbound: `Idempotency-Replayed: true|false` and, on replay, `Idempotency-Key-Created-At: <iso>`.

## Consequences

**Positive:**

- Manifesto §2.7 (idempotency required on writes) is satisfied for every mutation factory call site without consumer-level edits — 113 routes covered in one infrastructure change.
- Double-click submits, transient-5xx retries from `ApiClient`, and flaky-mobile dupes converge to a single response per key. The duplicate-row class is closed for everything that goes through the factories.
- Cross-tenant replay is structurally impossible: scope is derived server-side from the authenticated session (or client IP for public routes), never from a header.
- The port + registry pattern matches the existing rate-limit and monitoring layout, so a future swap to Redis (or any other store) is an adapter change with zero call-site impact.

**Negative:**

- The cached response _body_ lives at rest in the Postgres table for 24 hours. Nothing in the cached body is treated as more sensitive than the response itself, but operators should know it exists. Logs redact the user portion of the scope (`user:<sha256(userId).slice(0,12)>`) and never log the raw key — only the 12-char hash.
- Concurrent miss on the same `(key, scope, route)` lets BOTH apiFns run; the unique constraint serializes only the response-cache write, not the apiFn execution. The losing writer surfaces the winning writer's response. Domain side-effects (DB writes inside the apiFn) can therefore double in a true race window. Idempotency deduplicates the response surface, not the work. Endpoints that need stronger guarantees still need their own concurrency guard (advisory lock, optimistic version, etc).
- Errors thrown by the apiFn (validation 4xx, domain ConflictError, etc) propagate up through the wrapper to `withErrorHandling` and are NOT cached. A retry with the same key and body re-runs the handler. Acceptable for stateless validation; ambiguous for stateful conflicts (e.g., "user already exists" — first call created the user, second 4xx is correct because the domain layer would conflict anyway). Documented limitation; a future iteration can move idempotency above `withErrorHandling` to cache thrown errors too.
- Non-JSON live responses (an apiFn that returns plaintext, CSV, an empty 200, etc) gracefully skip caching: the `JSON.parse` of the response body is wrapped in `try/catch`, the wrapper logs `idempotency.cache_skipped_non_json`, and the live response flows back to the client unchanged. The current factory surface always emits JSON, but the wrapper no longer detonates if a future factory emits something else.
- No cron sweep in v1. Dead rows accumulate until the next miss on the same `(key, scope, route)` overwrites them. The B-tree on `expiresAt` keeps lookups fast, but operators may need to run `prisma.requestIdempotency.deleteMany({ where: { expiresAt: { lt: new Date() } } })` manually if the table grows uncomfortably.
- The 24-hour replay window means a state-changing request whose response is replayed long after the underlying state changed will return a stale view. Within the TTL, clients should treat replays as "the same answer the server gave you the first time", not "the current truth".
- A hostile proxy that sends multi-value `Idempotency-Key` headers gets the first value; a previous design accepted-and-rejected the concatenated value with 400. Either choice is defensible; we picked the more forgiving one to avoid bricking real clients behind misbehaving proxies.

**Neutral:**

- `packages/api-server` now declares `@repo/api-routes` as a workspace dependency for the type-only `IdempotencyStorePort` import. No runtime cycle (boot-time wiring only); dependency-cruiser passes.
- Logs gain `idempotency.no_key`, `idempotency.replay`, `idempotency.mismatch`, `idempotency.lookup_failed`, `idempotency.persist_failed`, `idempotency.race_resolved`, `idempotency.persist_race_unrecoverable`. All structured JSON via the project's `logger`.
- The `Idempotency-Replayed: false` annotation appears on every authoritative live response when the registry is wired. Absent header means either the request had no key, or the registry was never wired (dev/test).

## Alternatives considered

**Wrapper-style (`withIdempotency` / `withAuthIdempotency`).** Mirror the existing rate-limit pattern: each route opts in by wrapping its factory output. Rejected because it leaves manifesto §2.7 partially unmet — opt-in routes get coverage, the rest stay vulnerable. The resolution required extending the factories themselves so coverage is structural, not opt-in.

**In-memory LRU.** Faster, no DB hit. Rejected because Vercel deploys are multi-instance and serverless cold-starts evict the cache; a request retried against a different instance would not replay. Durability across cold-starts is the point.

**Redis / Upstash store.** The repo already uses Upstash for rate limiting. Sub-millisecond lookups, native TTL. Rejected for v1 because Postgres is the durability source of truth for everything else, the latency budget for one indexed lookup is well under 5 ms, and the port abstraction lets us swap if the workload demands it. We picked the boring option deliberately.

**Canonical JSON fingerprint.** Parse, canonicalize keys, then hash. More tolerant of clients that produce different field orderings. Rejected because there is exactly one client (`ApiClient`) and `JSON.stringify` produces a deterministic byte stream — the canonicalization step would burn CPU for a problem we don't have.

**Daily Vercel Cron sweep for cleanup.** Considered. Rejected for v1: introduces the first cron in the repo for a non-load-bearing cleanup, when lazy-delete on the `(key, scope, route)` upsert keeps the cache logically correct. Pure additive change later if the table grows.

**Advisory lock around the apiFn.** Would have closed the concurrent-miss race documented under Consequences. Rejected for v1 because it bumps the per-request cost (extra round-trip to acquire/release), the race is rare in practice, and the response-surface deduplication already handles the user-visible symptom (both clients see the same response). Endpoints that need strict execution serialization continue to use `pg_advisory_xact_lock` at the service layer.

**Caching thrown errors.** Putting `wrapHandler` _above_ `withErrorHandling` so domain errors land in the cache too. Rejected for v1 because the wrapper currently relies on `withErrorHandling` to convert errors into responses upstream of any caching consideration. A future iteration can move the seam — flagged in Consequences.

## References

- ADR 0007 — Prisma client isolated in api-server.
- ADR 0020 — API design (pagination + error shape, includes idempotency-key requirement on writes).
- ADR 0017 — anemic-domain handler shape (factories own cross-cutting concerns).
- Manifesto §2.7 — idempotency keys on writes.
