# Deployment Guide

## Architecture overview

The monorepo deploys **three independent Vercel projects** from a single git repository:

| App              | Purpose                                        | Route prefix      | Auth                     | DB access              |
| ---------------- | ---------------------------------------------- | ----------------- | ------------------------ | ---------------------- |
| `apps/admin`     | Business panel + Marketing CMS (desktop-first) | `/api/admin/*`    | NextAuth (ADMIN role)    | via `@repo/api-server` |
| `apps/marketing` | Public landing pages                           | `/api/public/*`   | None                     | via `@repo/api-server` |
| `apps/platform`  | Coach + Athlete experience (mobile-first PWA)  | `/api/platform/*` | NextAuth (COACH/ATHLETE) | via `@repo/api-server` |

All three apps share a single PostgreSQL database (Neon) and a single Vercel Blob store.

## Failure domains

Each app is a separate Vercel deployment with its own URL, build, and runtime. A failure in one app does not take down the others — with one exception:

| Failure                         | Impact                                                                                                                                                                    | Blast radius                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **Database down** (Neon outage) | All three apps lose data access. `/api/health` stays 200, `/api/ready` returns 503.                                                                                       | All apps                              |
| **Blob storage down**           | Image uploads fail. Existing images may still render from CDN cache.                                                                                                      | Admin (upload), all (image rendering) |
| **Admin deploy broken**         | CMS management unavailable. Marketing and Platform continue serving.                                                                                                      | Admin only                            |
| **Marketing deploy broken**     | Public site down. Admin and Platform unaffected.                                                                                                                          | Marketing only                        |
| **Platform deploy broken**      | Athlete/Coach experience down. Admin and Marketing unaffected.                                                                                                            | Platform only                         |
| **`@repo/api-server` bug**      | Depends on which endpoint is affected. A broken mapper in CMS affects Admin + Marketing but not Platform. A broken LMS mapper affects Platform + Admin but not Marketing. | Context-scoped                        |
| **NextAuth misconfiguration**   | Admin and Platform lose auth. Marketing is unaffected (no auth).                                                                                                          | Admin + Platform                      |
| **Prisma schema drift**         | If `prisma db push` runs a breaking migration, all apps are affected.                                                                                                     | All apps                              |

### Key insight

The shared database is the single point of failure. All three apps are independently deployable, but they share one schema and one connection string. A bad migration is the highest-risk deployment action.

## Health endpoints

Every app exposes three operational endpoints (added in 1.5.B):

| Endpoint           | What it checks                     | Healthy response                                       | Unhealthy response                    |
| ------------------ | ---------------------------------- | ------------------------------------------------------ | ------------------------------------- |
| `GET /api/health`  | Process is alive                   | `200 { "status": "ok" }`                               | N/A (if process is dead, no response) |
| `GET /api/ready`   | Database connectivity (`SELECT 1`) | `200 { "status": "ready" }`                            | `503 { "status": "not_ready" }`       |
| `GET /api/version` | Commit SHA + environment           | `200 { "sha": "abc123", "environment": "production" }` | N/A                                   |

Use `/api/ready` for load balancer health checks. Use `/api/version` to verify which commit is live after a deployment.

## Environment variables

All env vars are validated at boot time by `@repo/env` (Zod via `@t3-oss/env-nextjs`). A missing or malformed variable crashes the app on startup, not at request time.

### Required variables

| Variable                    | Scope  | Used by         | Description                                                  |
| --------------------------- | ------ | --------------- | ------------------------------------------------------------ |
| `DATABASE_URL`              | Server | All apps        | PostgreSQL connection string (Neon pooler URL)               |
| `NEXTAUTH_SECRET`           | Server | Admin, Platform | JWT signing secret for NextAuth                              |
| `NEXTAUTH_URL`              | Server | Admin, Platform | Canonical URL of the app (e.g., `https://admin.example.com`) |
| `NEXT_PUBLIC_APP_URL`       | Client | All apps        | Admin app public URL                                         |
| `NEXT_PUBLIC_MARKETING_URL` | Client | All apps        | Marketing app public URL                                     |
| `BLOB_READ_WRITE_TOKEN`     | Server | Admin           | Vercel Blob read/write token for file uploads                |

### Build-time variables

| Variable                | Purpose                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `SKIP_ENV_VALIDATION`   | Set to `1` to bypass Zod validation during build (CI uses dummy values) |
| `VERCEL_GIT_COMMIT_SHA` | Auto-injected by Vercel; exposed via `/api/version`                     |

### Per-app env usage

- **Marketing** imports only `@repo/env/base` (no auth, no blob).
- **Admin** imports `@repo/env/base` + `@repo/env/auth` + `@repo/env/blob` (in upload endpoint).
- **Platform** imports `@repo/env/base` + `@repo/env/auth`.

Each app has its own `.env.local` for local development. The `packages/api-server` directory has its own `.env` for Prisma CLI commands and tests.

## CI pipeline

GitHub Actions CI (`.github/workflows/ci.yml`) runs 6 parallel jobs on every PR and push to `main`:

| Job            | What it does                                                                             |
| -------------- | ---------------------------------------------------------------------------------------- |
| `check-types`  | `pnpm check-types` — TypeScript across all packages                                      |
| `lint`         | `pnpm lint` — ESLint across all packages                                                 |
| `dep-check`    | `pnpm dep:check` — dependency-cruiser boundary rules (enforces `BOUNDED-CONTEXTS.md` §8) |
| `format-check` | `pnpm format:check` — Prettier check on `**/*.{ts,tsx,md,json}`                          |
| `test`         | `pnpm test` — Vitest with a fresh `postgres:16-alpine` service container                 |
| `build`        | `pnpm build` — full production build with dummy env vars                                 |

Concurrency: newer pushes to the same ref cancel in-flight runs.

The test job uses a local Postgres container (not the Neon dev database) for isolation and determinism.

## Rollback procedure

### Vercel instant rollback

Vercel keeps every deployment immutable. To roll back:

1. Open the affected app's Vercel dashboard.
2. Find the last known-good deployment in the deployment list.
3. Click the three-dot menu and select "Promote to Production".

This is instant (seconds, not minutes) — no rebuild required.

### Database rollback

There is **no automated database rollback**. Prisma does not generate down-migrations. Rollback options:

1. **Forward-fix:** Write and apply a corrective migration.
2. **Point-in-time recovery:** Neon supports branching and PITR. Restore from a branch taken before the bad migration.
3. **Prevention:** Always review `prisma db push` changes before applying to production. Consider using `prisma migrate` with explicit migration files for production (not yet adopted — see ADR 0019 for the database-strategy deferral).

### Rollback checklist

1. Verify which commit is live: `curl https://<app-url>/api/version`
2. Check database connectivity: `curl https://<app-url>/api/ready`
3. If app-only issue: Vercel instant rollback to previous deployment.
4. If database issue: do NOT roll back the app without first assessing schema compatibility. A rolled-back app may not work with a forward-migrated schema.

## Deployment topology

```
                    +-----------+
                    |   Neon    |
                    | PostgreSQL|
                    +-----+-----+
                          |
              +-----------+-----------+
              |           |           |
        +-----+---+ +----+----+ +----+-----+
        |  Admin  | |Marketing| | Platform |
        | Vercel  | | Vercel  | |  Vercel  |
        +----+----+ +----+----+ +----+-----+
             |            |           |
             +---+--------+----+------+
                 |              |
           +-----+----+  +-----+-----+
           |Vercel Blob|  |  NextAuth |
           | (uploads) |  | (JWT/session)|
           +-----------+  +-----------+
```

## Security headers

All three apps serve identical security headers via `vercel.json` (added in 1.5.A):

- `Strict-Transport-Security`: 2 years + includeSubDomains + preload
- `X-Content-Type-Options`: nosniff
- `X-Frame-Options`: DENY
- `Referrer-Policy`: strict-origin-when-cross-origin
- `X-XSS-Protection`: 0 (modern browsers, CSP is the real protection)
- `Permissions-Policy`: camera, microphone, geolocation, browsing-topics all disabled
- `Content-Security-Policy`: baseline policy (self + unsafe-inline for Next.js hydration, blob storage for images)

Marketing additionally allows `images.unsplash.com` in `img-src` (seed data).

## Local development

```bash
pnpm install          # Install all dependencies + generate Prisma client
pnpm dev              # Start all three apps in dev mode (Turbo parallel)
pnpm --filter admin dev    # Start only admin
```

Each app needs a `.env.local` file. See the "Required variables" table above for what each app needs. The `packages/api-server/.env` file must contain `DATABASE_URL` for Prisma CLI commands.
