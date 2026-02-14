# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Discipline Program** — High-Performance Coaching Platform (LMS + Billing) with Marketing CMS.
Monorepo architecture using Turbo, Next.js 16, TypeScript, PostgreSQL + Prisma.

## Commands

```bash
pnpm dev              # Run all apps in dev mode
pnpm build            # Build all apps
pnpm check-types      # TypeScript validation (use this to verify changes)
pnpm lint             # ESLint across monorepo
pnpm format           # Prettier formatting

# Database (run from root, executes in packages/api-server)
pnpm db:generate      # Generate Prisma client after schema changes
pnpm db:push          # Push schema to database

# Single app dev
pnpm --filter admin dev
pnpm --filter marketing dev
pnpm --filter api dev
```

## Architecture

### Data Flow (Strict Order)

```
DB Schema → Contracts (Zod) → API Server → API Routes → Client UI
```

**Any change must follow this order.** If a field is required in Contracts, it must be required in DB.

### Monorepo Structure

```
apps/
  api/          # Next.js Route Handlers (BFF). NO business logic, NO Prisma.
  admin/        # Business panel + Marketing CMS (desktop-first)
  marketing/    # Public landing pages
  platform/     # [TO BE CREATED] Coach + Athlete product experience (mobile-first PWA)

packages/
  api-server/   # Business logic + Prisma. ONLY package that imports @prisma/client
  contracts/    # Zod schemas + TypeScript types. The Law. NO Prisma types allowed.
  api-client/   # HTTP client for API consumption
  auth/         # NextAuth configuration
  errors/       # Error hierarchy (AppError, HttpError)
  ui/           # Shared React components
  mui/          # MUI theme customization
  shared/       # Utilities, SEO constants
```

### Source of Truth

- `packages/api-server/prisma/schema.prisma` — Physical data reality
- `packages/contracts/` — API contract law (Zod schemas define what's valid)

### Layer Responsibilities

| Layer                 | Knows About                   | Does NOT Know About    |
| --------------------- | ----------------------------- | ---------------------- |
| `apps/*` (UI)         | Contracts, api-client         | Prisma, DB structure   |
| `apps/api`            | Contracts, api-server methods | Prisma client directly |
| `packages/api-server` | Prisma, Contracts             | UI components          |
| `packages/contracts`  | Zod                           | Prisma types, DB       |

### Contract Entity Structure

Each entity in `packages/contracts/src/entities/` follows:

```
{entity}/
  {entity}.schema.ts       # Zod schemas for data
  {entity}.types.ts        # TypeScript types (inferred from schemas)
  {entity}.constants.ts    # Constants
  {entity}-api.schema.ts   # Request/response schemas
  {entity}-api.types.ts    # API types
  index.ts                 # Barrel export
```

### Page Pattern (Admin/Marketing)

Server Component fetches data, passes to Client Component:

```tsx
// apps/admin/src/app/(dashboard)/blog/page.tsx
export default async function BlogPage() {
  const initialData = await api.blog.getPageData();
  return <BlogListView initialData={initialData} />;
}
```

Each navigation item = one module in `src/modules/`. Related CRUD pages (list/create/edit) share a module.

## Global Invariants (System Laws)

1. **Singleton Subscription**: 1 User = 1 Subscription record
2. **Money is Integer**: All monetary values in cents/kopeks. No floats.
3. **Logs are Immutable**: WorkoutLog never changes. Edits use Copy-on-Write.
4. **Reference Data Integrity**: Exercise references by ID only, never string names.
5. **Access = Subscription State**: Platform access via ACTIVE/TRIAL/PAST_DUE status only.

## Code Standards

- No `any`, no `@ts-ignore`, no "temporary solutions"
- No mock data in API if DB doesn't support it
- Named exports + arrow functions only
- Functional components only
- kebab-case for all file/directory names
- Component files: `.tsx`, non-components: `.ts`

## Commit Convention

Conventional commits enforced via commitlint:

```
feat|fix|docs|style|refactor|test|chore|revert|perf: subject in lowercase
```

Pre-commit hooks run: lint → format → check-types. Pre-push runs build.
