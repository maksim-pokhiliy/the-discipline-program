# The Discipline Program

High-performance coaching platform (LMS + Billing) with a Marketing CMS. Turbo monorepo built on Next.js 16, TypeScript (strict), PostgreSQL, and Prisma. Contract-first API design with strict layer isolation.

## Tech Stack

| Category   | Technology                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| Language   | TypeScript 5.7 (strict)                                                                                  |
| Framework  | Next.js 16 (App Router)                                                                                  |
| Database   | PostgreSQL (Neon) + Prisma 6                                                                             |
| UI         | MUI 7, React 19                                                                                          |
| State      | React Query 5, React Hook Form 7                                                                         |
| Validation | Zod                                                                                                      |
| Auth       | NextAuth.js v4.24.x (dual instance, see [ADR 0004](docs/adr/0004-nextauth-with-credentials-provider.md)) |
| Tests      | Vitest                                                                                                   |
| Monorepo   | Turborepo, pnpm                                                                                          |

## Quick Start

### Prerequisites

- **Node.js 20+** -- pinned via `.nvmrc` and `engines.node`. Recommended: `nvm use` or `volta install node@20`.
- **pnpm 10.33.2** -- pinned via `package.json#packageManager`. Easiest path: enable Corepack (`corepack enable`); falls back to `npm install -g pnpm@10.33.2`.
- **PostgreSQL 16** -- either a Neon connection string or a local container: `docker run -d --name dev-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine` (then set `DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres`).

### Setup

```bash
git clone <repo-url> && cd the-discipline-program
pnpm install
```

Copy `.env.example` to the locations below and fill in the values -- see [Environment Variables](#environment-variables) for the complete per-variable reference:

- `apps/admin/.env.local`, `apps/marketing/.env.local`, `apps/platform/.env.local` -- app URLs, auth secrets
- `packages/api-server/.env` -- `DATABASE_URL` (Neon PostgreSQL or local Docker)

#### Pulling shared secrets via Vercel CLI (recommended)

Rather than hard-coding Neon DB credentials, NextAuth secrets, and the Resend API key in `.env.local` files, pull them from the project's Vercel environment so your local mirrors what's deployed and rotates with it:

```bash
vercel link                                       # link the local checkout to the Vercel project (one-time)
vercel env pull apps/admin/.env.local             # repeat per-app for admin/marketing/platform
vercel env pull packages/api-server/.env          # api-server (DATABASE_URL for Prisma CLI + tests)
```

Re-run `vercel env pull` whenever a secret is rotated or a new variable is added. Never commit the resulting files (already covered by `.gitignore`).

#### Provisioning `BLOB_READ_WRITE_TOKEN` (admin only)

The admin app needs a personal Vercel Blob store for file uploads. Provision one at `Vercel Dashboard → Storage → Create Blob Store`, then copy the read/write token into `apps/admin/.env.local` as `BLOB_READ_WRITE_TOKEN`. Each contributor should use their own store -- don't share tokens.

```bash
pnpm db:generate    # generate Prisma client
pnpm db:push        # apply schema + CHECK constraints
pnpm db:seed        # seed marketing CMS pages + default coach/athlete (skip = empty UI)
pnpm dev            # all four apps in parallel
```

Apps start on ports 3000 (marketing), 3001 (platform), 3002 (admin), 6006 (storybook).

## Project Structure

```
apps/
  admin/          Business panel + Marketing CMS (desktop-first)
  marketing/      Public landing pages
  platform/       Coach + Athlete experience (mobile-first PWA)
  storybook/      Component development

packages/
  api-server/     Business logic + Prisma (sole DB accessor)
  api-routes/     Route handler factories, auth wrappers
  contracts/      Zod schemas + types (the law)
  api-client/     HTTP client for API consumption
  auth/           NextAuth configuration
  errors/         Error hierarchy
  ui/             Shared React components
  query/          React Query hooks factory
  shared/         Navigation, types, constants
  mui/            MUI theme + providers
  env/            Environment variable validation

docs/adr/         Architecture Decision Records (37)
```

## Commands

| Task            | Command                                             |
| --------------- | --------------------------------------------------- |
| Setup           | `pnpm setup` -- install + db:generate + push + seed |
| Dev (all apps)  | `pnpm dev`                                          |
| Dev (admin)     | `pnpm dev:admin`                                    |
| Dev (platform)  | `pnpm dev:platform`                                 |
| Dev (marketing) | `pnpm dev:marketing`                                |
| Dev (storybook) | `pnpm dev:storybook`                                |
| Build           | `pnpm build`                                        |
| Type check      | `pnpm check-types`                                  |
| Lint            | `pnpm lint`                                         |
| Format          | `pnpm format`                                       |
| Format check    | `pnpm format:check`                                 |
| Unit tests      | `pnpm test`                                         |
| Clean           | `pnpm clean`                                        |
| DB generate     | `pnpm db:generate`                                  |
| DB push         | `pnpm db:push`                                      |
| DB seed         | `pnpm db:seed`                                      |

## App Status

| App       | Status                                                                 |
| --------- | ---------------------------------------------------------------------- |
| Admin     | Production-ready. CMS + platform management.                           |
| Marketing | Production-ready. Billing flow stubbed.                                |
| Platform  | Active development (Phase 2). Auth, routing, 59 API routes, 8 modules. |

## Documentation

- [CLAUDE.md](CLAUDE.md) -- architecture, code standards, invariants, anti-patterns
- [docs/DEPLOY.md](docs/DEPLOY.md) -- deployment guide
- [docs/DEPENDENCY-GRAPH.md](docs/DEPENDENCY-GRAPH.md) -- package dependency map
- [docs/BOUNDED-CONTEXTS.md](docs/BOUNDED-CONTEXTS.md) -- domain boundaries
- [docs/adr/](docs/adr/) -- 37 Architecture Decision Records

## Data Flow

```
DB Schema -> Contracts (Zod) -> API Server -> API Routes -> Client UI
```

All changes follow this order. Contracts are the single source of truth for API shapes.

## Environment Variables

Validated at boot by `@repo/env` (Zod). `SKIP_ENV_VALIDATION=1` bypasses validation (used by CI + local build). See [docs/DEPLOY.md](docs/DEPLOY.md) for per-app usage details.

### Required

| Variable                    | Where                                 | Purpose                                                  |
| --------------------------- | ------------------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`              | all apps + `packages/api-server/.env` | PostgreSQL connection string (Neon or local).            |
| `NEXTAUTH_SECRET`           | admin + platform                      | JWT signing secret. Generate: `openssl rand -base64 32`. |
| `NEXTAUTH_URL`              | admin + platform                      | Canonical app URL for NextAuth callbacks.                |
| `NEXT_PUBLIC_APP_URL`       | all apps                              | Base URL for HTTP loopback + cross-app links.            |
| `NEXT_PUBLIC_MARKETING_URL` | all apps                              | Base URL for the marketing app.                          |
| `BLOB_READ_WRITE_TOKEN`     | admin (file uploads)                  | Vercel Blob read/write token.                            |

### Optional

| Variable                   | Purpose                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST URL for rate limiting (no-op when unset).        |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token.                                           |
| `NEXT_PUBLIC_SENTRY_DSN`   | Sentry DSN. Monitoring is no-op when unset.                         |
| `SENTRY_AUTH_TOKEN`        | Sentry auth token for source-map upload at build time.              |
| `SENTRY_ORG`               | Sentry org slug (source-map upload).                                |
| `SENTRY_PROJECT`           | Sentry project slug (source-map upload).                            |
| `SKIP_ENV_VALIDATION`      | Set to `1` to bypass Zod env validation. Used by CI + local builds. |
