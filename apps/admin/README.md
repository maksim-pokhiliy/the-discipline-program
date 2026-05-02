# admin

Internal business-panel + Marketing CMS for The Discipline Program. Authoring surface for the marketing site (Pages, Blog, Reviews, Products) and ops surface for the platform domain (Users, Library entities, Contacts). Desktop-first; not exposed to end users.

## Where it runs

- **Port:** `3002`
- **Dev:** `pnpm --filter admin dev` (or `pnpm dev` from the root for all apps via Turborepo)
- **Build:** `pnpm --filter admin build`
- **Bundle analyze:** `pnpm analyze:admin` (root)

## Environment

`apps/admin/.env.local`. Validators imported at module entry: `@repo/env/base`, `@repo/env/auth`, `@repo/env/sentry`. See the root [README — Environment Variables](../../README.md#environment-variables) for the per-variable reference and [`docs/DEPLOY.md`](../../docs/DEPLOY.md) for per-app usage.

Required in this app:

- `DATABASE_URL` — Postgres connection string (Neon).
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — admin runs its own NextAuth instance ([ADR 0011](../../docs/adr/0011-two-independent-nextauth-instances.md)).
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MARKETING_URL` — used for HTTP loopback ([ADR 0010](../../docs/adr/0010-bff-via-http-loopback-for-rsc.md)) and cross-app links.
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token for image uploads ([ADR 0013](../../docs/adr/0013-vercel-blob-for-image-storage.md)).

Optional: `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (rate limiting), `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` (monitoring).

## Layout

```
src/
  app/
    (auth)/login        Login route group (NextAuth credentials)
    (dashboard)/        Authoring + ops route group (Pages, Blog, Library, ...)
    api/                Route handlers (factories from @repo/api-routes)
  modules/              Feature modules — one per top-level dashboard entity
  lib/                  App-local helpers (auth wrappers, query client config)
  proxy.ts              Next.js middleware (auth gate + CSP nonce)
```

Module list (one folder per entity authored from the admin):

- `auth` — login UI
- `pages`, `blog`, `contacts`, `products`, `reviews` — Marketing CMS
- `users` — IAM / role management
- `block-kind-library`, `scheme-template-library`, `block-template-library`, `session-template-library`, `week-template-library`, `exercise-library`, `dashboard` — LMS authoring (templates promoted/demoted across SYSTEM/COACH scopes)

## Consumed contexts

The admin imports server logic from `@repo/api-server/{cms,lms,iam,coaching,storage,ops}` and contracts from `@repo/contracts/{cms,lms,coaching,iam}`. Domain boundaries are documented in [`docs/BOUNDED-CONTEXTS.md`](../../docs/BOUNDED-CONTEXTS.md) §10.

## Conventions

- Authoring forms reuse primitives from `@repo/ui` and `@repo/mui` — see project memory note "Pattern compliance" before adding a new one.
- Image fields go through Vercel Blob; video stays as a plain URL (memory: image upload existing flow).
- Promote/demote between scopes is row-only — see memory note "Promote/demote row-only" before touching library forms.

## Related ADRs

- [ADR 0010 — BFF via HTTP loopback for RSC](../../docs/adr/0010-bff-via-http-loopback-for-rsc.md)
- [ADR 0011 — two independent NextAuth instances](../../docs/adr/0011-two-independent-nextauth-instances.md)
- [ADR 0013 — Vercel Blob for image storage](../../docs/adr/0013-vercel-blob-for-image-storage.md)
- [ADR 0017 — Anemic domain model acceptable pre-product](../../docs/adr/0017-anemic-domain-model-acceptable-pre-product.md) (and its partial supersession ADR 0028)

See the root [README](../../README.md) for the full architecture overview.
