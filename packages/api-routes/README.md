# `@repo/api-routes`

Next.js route-handler factories + cross-cutting concerns (auth wrappers, rate limiting, CSP nonce middleware). Apps mount these factories to build their `app/api/**/route.ts` files instead of writing handlers by hand.

## Public API

```ts
import {} from /* factories, helpers */ "@repo/api-routes";
import {} from /* auth wrappers */ "@repo/api-routes/auth";
import {} from /* shared types */ "@repo/api-routes/types";
```

The auth wrappers are the default-deny mechanism: routes must be wrapped to opt-in to a public surface. The CSP middleware (`csp.ts`) emits the per-request nonce that the apps' `proxy.ts` consumes.

## Layout

```
src/
  index.ts              Barrel — handler factories + helpers
  auth-wrappers.ts      withAdminAuth / withCoachAuth / withAthleteAuth / withAuthenticated (built by createAuthWrappers; role-aware NextAuth glue)
  csp.ts                Per-request CSP nonce + header builder
  types.ts              Shared route-handler types
  <other>.ts            Rate-limit helpers, validation glue, error mappers
```

## Conventions

- All write endpoints (POST/PUT/PATCH/DELETE) MUST go through the rate-limit helper. No direct `NextResponse.json` in app handlers.
- Validation runs against a `@repo/contracts` Zod schema before the handler body executes.
- Error responses follow `{ error: { code, message, details? } }` per [ADR 0020](../../docs/adr/0020-api-design-decisions.md).

## Related ADRs

- [ADR 0017 — Anemic domain model acceptable pre-product](../../docs/adr/0017-anemic-domain-model-acceptable-pre-product.md)
- [ADR 0020 — API design decisions](../../docs/adr/0020-api-design-decisions.md) (pagination, error shape)
- [ADR 0036 — Idempotency-Key on mutation endpoints](../../docs/adr/0036-idempotency-key-on-mutation-endpoints.md) (default-on factory wrapper)
