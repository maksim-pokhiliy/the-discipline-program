# marketing

Public-facing landing site for The Discipline Program. Renders blog articles, the storefront, FAQ, and contact pages from the same Postgres tables the admin app authors. No end-user auth on this surface.

## Where it runs

- **Port:** `3000`
- **Dev:** `pnpm --filter marketing dev`
- **Build:** `pnpm --filter marketing build`
- **Bundle analyze:** `pnpm analyze:marketing` (root)

## Environment

`apps/marketing/.env.local`. Validators imported at module entry: `@repo/env/base`, `@repo/env/sentry`. See the root [README — Environment Variables](../../README.md#environment-variables) and [`docs/DEPLOY.md`](../../docs/DEPLOY.md).

Required in this app:

- `DATABASE_URL` — Postgres connection string for read-only CMS queries.
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MARKETING_URL` — used by HTTP loopback ([ADR 0010](../../docs/adr/0010-bff-via-http-loopback-for-rsc.md)) and cross-app links.

Optional: `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (rate limiting on contact forms), Sentry tokens, `SKIP_ENV_VALIDATION=1` (CI/build bypass).

## Layout

```
src/
  app/
    page.tsx            Home
    blog/, blog/[slug]  Blog list + article
    storefront/         Product browse + detail
    about/, faq/        Static content backed by CMS rows
    contact/            Contact form (rate-limited)
    api/                Route handlers (CMS read endpoints, contact intake)
  modules/              Feature modules per page (home, blog, blog-article, contact, faq, about, storefront)
  lib/                  App-local helpers
  proxy.ts              Next.js middleware (CSP nonce only — no auth)
```

Modules: `home`, `blog`, `blog-article`, `contact`, `faq`, `about`, `storefront`.

## Conventions

- Animations use `framer-motion` — only this app pulls it in.
- Marketing reads from the CMS context only — it does not import LMS or coaching contracts. See [`docs/BOUNDED-CONTEXTS.md`](../../docs/BOUNDED-CONTEXTS.md) for context boundaries.
- Public surface — no NextAuth instance lives here. Any state-changing endpoint (contact form) MUST be rate-limited via the Upstash helper from `@repo/api-routes`.
- Billing flow is currently stubbed (the storefront can browse but cannot charge). Real payment integration lives behind a separate ADR/feature, not yet shipped.

## Related ADRs

- [ADR 0010 — BFF via HTTP loopback for RSC](../../docs/adr/0010-bff-via-http-loopback-for-rsc.md)
- [ADR 0017 — anemic-domain handler shape](../../docs/adr/0017-anemic-domain-handler-shape.md)
- [ADR 0020 — API design decisions](../../docs/adr/0020-api-design-decisions.md) (pagination, error shape)

See the root [README](../../README.md) for the full architecture overview.
