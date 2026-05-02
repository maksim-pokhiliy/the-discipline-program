# `@repo/api-client`

HTTP client for consuming the apps' REST surface from the browser AND from React Server Components. Wraps `fetch` with auth-cookie forwarding, error normalization, and the BFF loopback discipline ([ADR 0010](../../docs/adr/0010-bff-via-http-loopback-for-rsc.md)).

## Public API

```ts
import {} from /* browser client */ "@repo/api-client";
import {} from /* server client (RSC + route handlers) */ "@repo/api-client/server";
```

Two entry points by design: the server entry forwards the inbound NextAuth session cookie via `cookies()` so the loopback request authenticates as the same user; the browser entry uses the natural cookie jar.

## Layout

```
src/
  index.ts              Browser entry — barrel
  server.ts             Server entry — RSC + route-handler safe
  <other>.ts            Fetch wrapper, error normalization, retry/backoff helpers
```

## Conventions

- Errors normalize to `@repo/errors` shapes; consumers surface them via `notifyError` (and/or `getIssues`) from `@repo/query` (`packages/query/src/hooks/notify-error.ts`) before falling back to `error.message`.
- `cache: 'no-store'` is the default discipline for write paths and per-request reads. Caching is opt-in.

## Related ADRs

- [ADR 0010 — BFF via HTTP loopback for RSC](../../docs/adr/0010-bff-via-http-loopback-for-rsc.md)
- [ADR 0020 — API design decisions](../../docs/adr/0020-api-design-decisions.md)
