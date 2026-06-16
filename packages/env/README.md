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
```

## Conventions

- Each app imports the validators it needs from its `instrumentation.ts` and `next.config.ts` so failures surface at boot, not at request time.
- `SKIP_ENV_VALIDATION=1` bypasses validation for CI builds and local one-off scripts. Production must boot with full validation.
- Real keys never live in `.env.example` — placeholders only.

## Related ADRs

- [ADR 0018 — security deferred decisions](../../docs/adr/0018-security-deferred-decisions.md) (env-handling rationale)
