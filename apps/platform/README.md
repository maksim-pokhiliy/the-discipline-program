# platform

Coach + athlete experience for The Discipline Program. Mobile-first PWA serving the coach console and athlete-facing surface. Independent NextAuth instance, separate from admin.

## Where it runs

- **Port:** `3001`
- **Dev:** `pnpm --filter platform dev`
- **Build:** `pnpm --filter platform build`
- **Bundle analyze:** `pnpm analyze:platform` (root)

## Environment

`apps/platform/.env.local`. Validators imported at module entry: `@repo/env/base`, `@repo/env/auth`, `@repo/env/sentry`. See the root [README — Environment Variables](../../README.md#environment-variables) and [`docs/DEPLOY.md`](../../docs/DEPLOY.md).

Required in this app:

- `DATABASE_URL` — Postgres connection string.
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — platform runs its own NextAuth instance ([ADR 0011](../../docs/adr/0011-two-independent-nextauth-instances.md)).
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MARKETING_URL` — HTTP loopback + cross-app links.

Optional: `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (rate limiting on writes), Sentry tokens.

## Layout

```
src/
  app/
    (auth)/             Auth route group (login, accept-invite)
    athlete/            Athlete-facing routes (today's session, profile)
    coach/              Coach-facing routes (athletes, plans, profile)
    api/                Route handlers covering coaching, IAM, storage, ops surfaces
  modules/              Feature modules — one per top-level concern
  lib/                  App-local helpers (auth wrappers, query client, role guards)
  proxy.ts              Next.js middleware (auth gate + role split + CSP nonce)
```

Modules:

- `auth`, `invite` — login + invite-accept flows
- `dashboard` — athlete today / coach overview entry
- `athletes`, `plans` — coach console (browse athletes, list plans)

The athlete vs coach surface split is enforced at the route level (`app/athlete/*` vs `app/coach/*`) and at the proxy level (role-based redirect). Platform consumes the coaching, IAM, and storage contexts — see [`docs/BOUNDED-CONTEXTS.md`](../../docs/BOUNDED-CONTEXTS.md).

## Conventions

- Mobile-first: `Stack spacing={4}` is the spacing primitive (memory: pattern compliance). Reuse `ChipTab` / admin filter primitives — do not reinvent.
- Mutation `onError` MUST chain through `notifyError` (and/or `getIssues`) from `@repo/query` (`packages/query/src/hooks/notify-error.ts`) before falling back to `error.message`.
- Athlete-facing reads are cache-sensitive — see ADR 0010 for the BFF caching rationale and the `cache: 'no-store'` discipline.

## Related ADRs

- [ADR 0010 — BFF via HTTP loopback for RSC](../../docs/adr/0010-bff-via-http-loopback-for-rsc.md)
- [ADR 0011 — two independent NextAuth instances](../../docs/adr/0011-two-independent-nextauth-instances.md)
- [ADR 0017 — Anemic domain model acceptable pre-product](../../docs/adr/0017-anemic-domain-model-acceptable-pre-product.md)
- [ADR 0037 — plan editor and library rollback](../../docs/adr/0037-plan-editor-and-library-rollback.md)

See the root [README](../../README.md) for the full architecture overview.
