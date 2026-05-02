# `@repo/query`

TanStack Query (React Query 5) wrappers — typed query/mutation hook factories that consume `@repo/contracts` schemas + `@repo/api-client` calls. Provides the apps with consistent cache keys, error normalization, and toast/sonner glue.

## Public API

```ts
import {} from /* hook factories + utilities */ "@repo/query";
```

Single entry point. Factories produce strongly-typed `useXQuery` / `useXMutation` hooks bound to a specific contract entity; cache-key conventions live alongside the factory.

## Layout

```
src/
  index.ts        Barrel — query/mutation factories, cache-key helpers, default options
  <factory>.ts    One file per factory class (queries, mutations, infinite queries)
```

## Conventions

- Cache keys are an array per entity: `[context, entity, scope, ...filters]`. Invalidation uses prefix matches.
- Mutation `onError` callbacks chain through `notifyError` (and/or `getIssues`) from `@repo/query` (`src/hooks/notify-error.ts`) before falling back to `error.message`.
- Toast surfacing routes through `sonner` (declared as a peer dependency).
- Tests live next to the hook (`*.test.ts`), use `@testing-library/react` + `jsdom`.

## Related ADRs

- [ADR 0010 — BFF via HTTP loopback for RSC](../../docs/adr/0010-bff-via-http-loopback-for-rsc.md) (cache discipline)
