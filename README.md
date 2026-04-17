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
| Tests      | Vitest, Playwright                                                                                       |
| Monorepo   | Turborepo, pnpm                                                                                          |

## Quick Start

```bash
git clone <repo-url> && cd the-discipline-program
pnpm install
```

Copy environment files:

- `apps/admin/.env.local`, `apps/marketing/.env.local`, `apps/platform/.env.local` -- app URLs, auth secrets
- `packages/api-server/.env` -- `DATABASE_URL` (Neon PostgreSQL)

```bash
pnpm db:generate
pnpm db:push
pnpm dev
```

Apps start on ports 3000 (marketing), 3001 (platform), 3002 (admin).

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

e2e/              Playwright test suites
docs/adr/         Architecture Decision Records (26)
```

## Commands

| Task           | Command                   |
| -------------- | ------------------------- |
| Dev (all apps) | `pnpm dev`                |
| Dev (single)   | `pnpm --filter admin dev` |
| Build          | `pnpm build`              |
| Type check     | `pnpm check-types`        |
| Lint           | `pnpm lint`               |
| Format         | `pnpm format`             |
| Unit tests     | `pnpm test`               |
| E2E tests      | `pnpm e2e`                |
| DB generate    | `pnpm db:generate`        |
| DB push        | `pnpm db:push`            |

## App Status

| App       | Status                                                                 |
| --------- | ---------------------------------------------------------------------- |
| Admin     | Production-ready. CMS + platform management.                           |
| Marketing | Production-ready. Billing flow stubbed.                                |
| Platform  | Active development (Phase 2). Auth, routing, 34 API routes, 5 modules. |

## Documentation

- [CLAUDE.md](CLAUDE.md) -- architecture, code standards, invariants, anti-patterns
- [docs/DEPLOY.md](docs/DEPLOY.md) -- deployment guide
- [docs/DEPENDENCY-GRAPH.md](docs/DEPENDENCY-GRAPH.md) -- package dependency map
- [docs/BOUNDED-CONTEXTS.md](docs/BOUNDED-CONTEXTS.md) -- domain boundaries
- [docs/adr/](docs/adr/) -- 26 Architecture Decision Records

## Data Flow

```
DB Schema -> Contracts (Zod) -> API Server -> API Routes -> Client UI
```

All changes follow this order. Contracts are the single source of truth for API shapes.
