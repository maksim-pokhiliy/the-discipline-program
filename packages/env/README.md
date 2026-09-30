# `@repo/env`

Environment-variable validation for the monorepo. Each subpath exports a `@t3-oss/env-nextjs` validator scoped to a concern; apps import only the subpaths they actually use, so unused env vars never reach the validator and never block boot.

## Public API

```ts
import "@repo/env/base"; // DATABASE_URL, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_MARKETING_URL
import "@repo/env/auth"; // NEXTAUTH_SECRET, NEXTAUTH_URL
import "@repo/env/blob"; // BLOB_READ_WRITE_TOKEN
import "@repo/env/email"; // Resend / email-provider keys
import "@repo/env/rate-limit"; // UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
import "@repo/env/sentry"; // NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT
import "@repo/env/mobile-publish"; // MOBILE_PUBLISH_ENCRYPTION_KEY, LEGACY_MOBILE_API_BASE_URL
import "@repo/env/mobile-shim"; // MOBILE_SHIM_JWT_SECRET
import "@repo/env/monobank"; // MONOBANK_API_URL, MONOBANK_MERCHANT_TOKEN, MONOBANK_WEBHOOK_PUBLIC_KEY
import "@repo/env/billing"; // BILLING_ENCRYPTION_KEY
```

Side-effect imports validate at module load. The `base` validator additionally re-exports `baseEnv` for code that needs typed access (`import { baseEnv } from "@repo/env/base"`).

## Layout

```
src/
  base.ts        Core URLs + DATABASE_URL — required everywhere
  auth.ts        NextAuth secrets — admin + platform
  blob.ts        Vercel Blob token — admin + platform
  email.ts       Email provider — admin (transactional only, currently)
  rate-limit.ts  Upstash Redis — apps that gate writes
  sentry.ts      Sentry DSN + build-time tokens
  mobile-publish.ts  Legacy mobile connector — encryption key + legacy API base URL (admin + platform)
  mobile-shim.ts     Mobile compat shim — JWT secret for the iOS bearer token (platform)
  monobank.ts    Monobank acquiring — API URL, merchant token, optional pinned webhook key (platform, read from 1.1; validated when a billing module first imports it, never from next.config.ts)
  billing.ts     Card-token cipher key (platform, read from 1.1; validated when a billing module first imports it, never from next.config.ts)
```

## Conventions

- Each app imports the validators it needs from its `instrumentation.ts` and `next.config.ts` so failures surface at boot, not at request time. `monobank` and `billing` are an exception: no `instrumentation.ts` or `next.config.ts` imports them, so they are validated only when the api-server code that reads them (`infrastructure/payment/index.ts`, `endpoints/billing/card-token-cipher.ts`) is first imported, from storefront-billing 1.1 by a billing route.
- `SKIP_ENV_VALIDATION=1` bypasses validation for CI builds and local one-off scripts. Production must boot with full validation.
- Real keys never live in `.env.example` — placeholders only.

## Related ADRs

- [ADR 0018 — security deferred decisions](../../docs/adr/0018-security-deferred-decisions.md) (env-handling rationale)
