# Cache port

Key-value cache with optional TTL. Used for memoizing expensive reads (dashboard aggregates, coach dashboard queries, page data), caching computed derived values that don't need per-request freshness, and any hot path where read volume >> write volume.

## Why a port?

Cache backends are commoditized: Redis, Upstash, Vercel KV, in-memory, Cloudflare KV — all expose get/set/delete at their core. Binding the codebase to one vendor (e.g. importing `@upstash/redis` directly in endpoints) recreates the exact vendor-lock problem that 1.4.A solved for `@vercel/blob`. The port fixes a minimal uniform shape; the adapter encapsulates serialization, connection pooling, and vendor quirks.

## Shape

`get<T>(key)` returns the cached value typed as `T` or `null` if absent. The generic is a soft contract — the adapter JSON-serializes on `set` and parses on `get`, so `T` must be JSON-serializable. Non-JSON values (Date, Map, class instances) are the caller's responsibility to convert at the boundary.

`set<T>(key, value, { ttlSeconds? })` writes the value with an optional TTL. Zero or omitted TTL means "persist until explicitly deleted" — adapters must honor this, not default to an arbitrary TTL.

`delete(key)` is a no-op if the key is absent — don't throw on missing keys. This mirrors Redis `DEL` semantics and keeps call sites simpler (no need to check-then-delete).

## Vendor candidates

| Vendor        | Model                      | Cost                       | Notes                                                                             |
| ------------- | -------------------------- | -------------------------- | --------------------------------------------------------------------------------- |
| Upstash Redis | Serverless Redis over HTTP | Pay-per-request, free tier | First-class Vercel integration; works on Edge Runtime; HTTP overhead vs TCP       |
| Vercel KV     | Managed Upstash reskin     | Pay-per-request            | Same engine as Upstash, tighter Vercel billing; vendor lock to Vercel             |
| Redis Cloud   | Traditional Redis          | Fixed cost                 | Cheaper at sustained high volume; TCP-only; doesn't work on Vercel Edge           |
| In-memory     | `Map` in process           | Free                       | Useful for tests and single-instance dev; cache is lost on every deploy / restart |

Current lean: **Upstash Redis** for v1 — the HTTP-based connection model works on both Node and Edge, no connection pooling headaches on serverless, and it's a 1-line swap to Vercel KV if Vercel's billing proves more convenient. An in-memory adapter will also exist for tests (following the `vi.fn()` fake pattern from `endpoints/iam/upload.test.ts` — a real `InMemoryCacheAdapter` might be cleaner than a fake for testing cache-heavy endpoints).

## Open questions (deferred until vendor is chosen)

- **Scan / batch get.** Some flows want "get all keys matching a prefix" (e.g. invalidate all dashboard-computation keys for user X). Redis `SCAN` + `MGET` handle this. Not in the port because scanning is a Redis-ism that doesn't cleanly portable to non-Redis backends. Will add a `deleteByPrefix(prefix)` method when first consumer needs it — Upstash supports scan via the REST API.
- **Counter / rate-limit primitives.** `INCR` + `EXPIRE` is the standard Redis rate-limit pattern. Could live in this port as `increment(key, { ttlSeconds })` or in a separate `RateLimitPort`. Deferred until the first rate-limited endpoint appears (e.g. login brute-force protection in §3 Security).
- **Pub/sub.** Redis supports pub/sub natively. If we use it (e.g. WebSocket server-to-server messaging), it becomes a separate `PubSubPort`, not this one. Mixing pub/sub into a cache port is a category error.
- **Stale-while-revalidate semantics.** React Query does SWR on the client side; for server-side SWR (fetch, cache, return stale, re-fetch in background) the endpoint layer composes `cache.get` + `cache.set` explicitly — the port itself stays minimal. If we see the SWR pattern repeated in 3+ endpoints, extract a `cacheWithSWR(cache, key, loader, ttl)` helper, not a port method.
- **Serialization format.** JSON is the obvious default but loses type fidelity (Date → string, BigInt → error, etc.). Adapter-level decision — the port shape doesn't commit to it.

## Adapter placement

When vendor is chosen:

1. `infrastructure/cache/upstash-redis-adapter.ts` (or similar) — the ONLY file in the repo that imports the vendor SDK.
2. `infrastructure/cache/in-memory-adapter.ts` — test double + local dev backend. Pure JS `Map` with `setTimeout`-based TTL. No external dependency.
3. Register env vars in `packages/env/cache.ts` (create this file when the adapter lands).
4. Update `infrastructure/cache/index.ts` to re-export both adapter factories and expose `defaultCache = process.env.NODE_ENV === "test" ? createInMemoryAdapter() : createUpstashAdapter()` — or pass the adapter via explicit DI if endpoint factories need per-test injection.
5. Consumers inject via factory-DI: `createXxxAdminApi({ cache })`.

## Non-goals

- **Session storage.** NextAuth handles its own session store via Prisma adapter. Not this port.
- **Full-text search / secondary indexes.** That's a different tool (Meilisearch, Algolia, Postgres GIN). Caching computed search results is fine; implementing search on top of a cache is not.
- **Persistent storage masquerading as cache.** If data must survive a cache eviction and can't be re-derived, it belongs in Postgres, not Redis. The port MUST allow adapters to evict under memory pressure — caller cannot assume anything stays forever.
