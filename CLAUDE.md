# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Discipline Program** — High-Performance Coaching Platform (LMS + Billing) with Marketing CMS.
Monorepo architecture using Turbo, Next.js 16, TypeScript, PostgreSQL + Prisma.

**Philosophy:** Quality > Speed. No deadlines. Clean and strong solutions over fast ones.
Don't be afraid to break and rebuild if necessary.

**Product concept:** see `docs/ARCHITECTURE.md`.
**Progress & roadmap:** see `docs/ROADMAP.md`.

## Role

Act as Senior Lead Architect, Senior Lead Software Engineer, Project Manager, Product Manager, Business Analyst, and Product Owner — all at Magnificent 7 level.
Think 12 months ahead. Every change validated in order: Product → Business → Architecture → Code.

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
pnpm --filter platform dev
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
  admin/        # Business panel + Marketing CMS (desktop-first). Own route handlers: /api/admin/*
  marketing/    # Public landing pages. Own route handlers: /api/public/*
  platform/     # Coach + Athlete product experience (mobile-first PWA). Own route handlers: /api/platform/*

packages/
  api-server/   # Business logic + Prisma. ONLY package that imports @prisma/client
  api-routes/   # Route handler utilities: auth wrappers, error handler, CRUD factories
  contracts/    # Zod schemas + TypeScript types. The Law. NO Prisma types allowed.
  api-client/   # HTTP client for API consumption
  auth/         # NextAuth configuration
  errors/       # Error hierarchy (AppError, HttpError)
  ui/           # Shared React components (Sidebar, DataTable, FormView, FormCard, etc.)
  query/        # React Query setup: QueryProvider, query keys, CRUD hooks factory
  shared/       # Navigation configs, types, SEO constants, layout constants
  mui/          # MUI theme, NextProvider (AppRouterCacheProvider + ThemeProvider)
  env/          # Environment variable validation (Zod)
```

### App Status

| App       | Status                                                                                                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Marketing | Working. Billing flow excluded (pages exist as stubs). Routes: `/api/public/*`                                                               |
| Admin     | Working. CMS (blog, pages, reviews, products, contacts) + Platform section (exercises, categories, users, dashboard). Routes: `/api/admin/*` |
| Platform  | Scaffolded (Phase 2). Auth, routing, base layout exist. UI screens — Phase 3+. Routes: `/api/platform/*`                                     |

### Source of Truth

- `packages/api-server/prisma/schema.prisma` — Physical data reality
- `packages/contracts/` — API contract law (Zod schemas define what's valid)

### Layer Responsibilities

| Layer                  | Knows About                                    | Does NOT Know About    |
| ---------------------- | ---------------------------------------------- | ---------------------- |
| `apps/*` (UI + routes) | Contracts, api-client, api-server, api-routes  | Prisma client directly |
| `packages/api-server`  | Prisma, Contracts                              | UI components          |
| `packages/api-routes`  | Auth wrappers, error handling, route factories | Business logic, Prisma |
| `packages/contracts`   | Zod                                            | Prisma types, DB       |

### Contract Entity Structure

Each entity in `packages/contracts/src/entities/` follows:

```
{entity}/
  {entity}.schema.ts       # Zod schemas for data
  {entity}.types.ts        # TypeScript types (inferred from schemas)
  {entity}.constants.ts    # Constants (if needed)
  {entity}-api.schema.ts   # Request/response schemas
  {entity}-api.types.ts    # API types
  index.ts                 # Barrel export
```

New entities also need:

- Export path in `packages/contracts/package.json` (`"./entity-name": "./src/entities/entity-name/index.ts"`)
- Barrel export in `packages/contracts/src/index.ts`

## Global Invariants (System Laws)

1. **Singleton Subscription**: 1 User = 1 Subscription record
2. **Money is Integer**: All monetary values in cents/kopeks. No floats.
3. **Logs are Immutable**: WorkoutLog never changes. Created once. Deleted whole (cascade SetLogs).
4. **Reference Data Integrity**: Exercise references by ID only, never string names. Exercise with active references cannot be hard-deleted.
5. **Access = Subscription State**: Platform access via ACTIVE/TRIAL/PAST_DUE status only.
6. **Purchase = Immediate Value**: Product purchase → auto-enroll on linked TrainingPlan. No "empty platform" state.
7. **Shared Exercise Library**: One library for the whole business. Read access for all roles, write for ADMIN and COACH.

## Code Standards

### General

- No `any`, no `@ts-ignore`, no "temporary solutions"
- No mock data in API if DB doesn't support it. Better to break UI than lie in API.
- Named exports only. No default exports.
- Arrow functions only.
- Functional components only. No class components.
- kebab-case for all file/directory names.
- Component files: `.tsx`, non-component files: `.ts`.

### DRY & Reusability

- Don't repeat yourself. When code gets reused, refactor and extract — don't copy-paste.
- Write code for reusability across different parts of the project.

### Components

- **Atomic components.** Split complex components into small, focused, reusable parts. Prefix child components with parent name (`CategoriesTable`, `CategoriesTableRow`, `CategoriesTableCell`).
- **Customizable.** Allow component usage to be customized — accept props with sensible defaults, spread remaining props.
- **MUI Box as base.** When not using a specific MUI component, use `Box` instead of `div`/`span`. This gives access to MUI theme, `sx` and CSS utilities.
- **Separate types from component props.** Define prop types as a named type above the component.

```tsx
type TypographyTitleProps = TypographyProps & { content: ReactNode };

export const TypographyTitle: React.FC<TypographyTitleProps> = ({
  content,
  children,
  variant = "title",
  ...props
}) => {
  return (
    <Typography variant={variant} {...props}>
      {content || children}
    </Typography>
  );
};
```

### Naming

- Components and hooks: descriptive, prefixed when related to parent.
- No generic names (`Index`, `Table`, `Row`). Always context-specific (`CategoriesTable`, `CategoriesTableRow`).

### Modules

Each navigation item = one module in `src/modules/`.
Related CRUD pages (list/create/edit) share a module.

### URL State

- All pages must be reproducible — URL is the state. Filtered/sorted views must be shareable.
- All filter state goes into URL params: `page/url?filters.statuses=1,2,3&filters.createdAfter=2024-01-01`
- Any button/link must be openable in a new tab.

### Page Pattern

Server Component fetches data via server API client, passes to Client Component:

```tsx
import { serverApi } from "@app/lib/api/server";
import { BlogPageClient } from "@app/modules/blog";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const initialData = await serverApi.blog.getPageData();
  return <BlogPageClient initialData={initialData} />;
}
```

`page.tsx` is the only file that uses default export (Next.js requirement).

**API client pattern:** Each app has `browserApiClient` (baseUrl: `""`, same-origin) for client components and `serverApiClient` (baseUrl: `NEXT_PUBLIC_APP_URL`) for server components. Route handlers live inside each app — no separate BFF.

## Anti-patterns (Learned Rules)

**Meta-rule:** When the user points out a mistake or a bad pattern, add it here immediately. These rules are permanent and must be followed in all future work.

- **No `display: "flex"` in sx.** Use MUI `Stack` component instead. Stack is already `display: flex`. Exceptions: Card/CardContent where flex is needed for stretch behavior, styled circle/shape containers for icon centering, complex styled components (e.g. RichTextEditor).
- **One directory per concern.** Never create parallel directories for the same thing (`src/lib/components/` and `src/shared/components/`, two `hooks/` dirs, etc.). Pick one canonical location and stick to it.
- **No manual MUI type unions.** Don't hardcode `"primary" | "secondary" | "success" | ...` — derive from MUI types (e.g., `PaletteColorKey` from `Palette` + `PaletteColor`). If the theme changes, the type updates automatically.
- **No loose files in organized directories.** If a directory uses subdirectories for grouping (e.g. `lib/` has `api/`, `hooks/`, `components/`), don't drop files at the root level. Place them in a semantically appropriate subdirectory (e.g. `lib/server/` for server-only utils).
- **No manual loading state for mutations.** Don't use `useState` to track mutation loading (`loadingId`, `updatingId`). Use React Query's built-in `mutation.isPending` + `mutation.variables` for per-item disabled state.
- **Static data outside components.** Arrays and objects that don't depend on props/state (`filters`, config maps, pure helper functions) must be defined at module level, not inside component bodies.
- **No inline money math.** Never write `/ 100`, `* 100` for cents↔amount conversion. Use `centsToAmount()` / `amountToCents()` from `@repo/shared`. Magic number 100 must exist in exactly one place.
- **MUI-consistent sizing and spacing.** Never use raw pixel strings (`"24px"`, `"0.75rem"`) for spacing, sizes, or dimensions in `sx` props. Use `theme.spacing()` or MUI's numeric spacing shorthand (`p: 2`, `mr: 1`). For widths/heights, use theme spacing units or responsive breakpoints. For font sizes, use MUI Typography variants, not custom sizes. Exception: one-off decorative values (border-radius, letter-spacing) where no MUI token exists.
- **No unprotected API routes.** Every route handler must use `withAdminAuth` or `withPlatformAuth` wrapper from `@repo/api-routes`. Public routes (`/api/public/*`) are the only exception. Never export a raw handler without an auth wrapper.
- **No custom UI when MUI has a native component.** Use MUI components as-is (e.g. `Alert` for alerts, `Chip` for tags). Customize appearance through the global MUI theme, not per-instance `sx` overrides or custom wrappers. Never reinvent what the design system already provides.
- **No raw color values in components.** Never use `rgba(...)`, `#hex`, `rgb(...)` in `sx` props or inline styles. Always use MUI theme tokens: `"background.paper"`, `theme.palette.error.main`, `alpha()` from `@mui/material/styles`, etc.
- **No side effects in queryFn.** Never call mutating endpoints (POST/PUT/DELETE) inside a React Query `queryFn`. Queries auto-refetch on focus, reconnect, and retry — turning mutations into repeated uncontrolled side effects. Use `useMutation` for side effects and gate the query with `enabled` on mutation completion.
- **No hardcoded enum/status strings.** Never use string literals (`"COMPLETED"`, `"ACTIVE"`, etc.) for domain statuses or enum values in logic. Import named constants from `@repo/contracts` and use them. If individual constants don't exist — create them. Hardcoded strings silently break when values change and bypass refactoring tools.
- **No non-null assertions (`!`).** Never use `!` to silence TypeScript's null checks. Use type predicates in `.filter()`, explicit null guards, or optional chaining. If TypeScript says it might be null — handle it, don't muzzle the compiler. Enforced by `@typescript-eslint/no-non-null-assertion` ESLint rule.
- **No raw CSS transition strings.** Never use `transition: "background-color 0.15s"` or similar raw strings. Use MUI's `theme.transitions.create()` API — it ensures consistent durations and easing across the app and respects `prefers-reduced-motion`.
- **No raw HTML elements in components.** Never use `<div>`, `<span>`, `<ul>`, `<li>`, etc. directly. Use MUI equivalents: `Box`, `Typography`, `Stack`, `List`, `ListItem`, etc. MUI components provide theme integration, `sx` prop, and consistent spacing. The only exception is `<table>`-related tags if MUI Table is overkill for a trivial case.
- **Use shared UI abstractions.** Never hand-roll `Dialog`/`DialogTitle`/`DialogContent`/`DialogActions` directly. Use `FormModal`, `ConfirmationModal`, or `BaseModal` from `@repo/ui`. They handle padding, button sizing, loading states, backdrop blocking, and escape key consistently. Same principle applies to any component that already has a shared abstraction.
- **Destructive actions require confirmation.** Every destructive action (delete, archive, etc.) must go through `ConfirmationModal` with `type="danger"`. The modal must show `isConfirming` loading state from the mutation — never close the modal optimistically before the operation completes.
- **Inline editing: blur = commit, no Escape cancel.** Inline inputs commit on blur and Enter. No Escape-to-cancel — users expect the field to just save what they typed. Keep it simple: edit → leave → saved.
- **No optimistic updates for confirmed destructive actions.** Mutations behind a `ConfirmationModal` must NOT use optimistic cache updates. The optimistic removal unmounts the component → the modal disappears before the request completes. Use `onSuccess` → invalidate instead, so the modal shows loading → request completes → modal closes → UI updates.
- **No `as` casts for Prisma→Contract enum conversion.** Never cast Prisma enum types to contract types with `as`. Use the type-safe mapping Records from `mappers/enum-maps.ts` (e.g., `UNIT_MAP[prismaValue]`). If TypeScript can't verify the mapping, add a new entry to enum-maps — don't bypass the compiler.
- **Soft-delete through the Prisma extension only.** Never manually set `deletedAt = new Date()` or check `deletedAt` in queries. The soft-delete extension in `db/client.ts` handles filtering and deletion for all registered models. Use `prisma.model.delete()` — the extension intercepts it. To add a new soft-delete model, add it to `SOFT_DELETE_MODELS` in client.ts and add unique fields to `SOFT_DELETE_UNIQUE_FIELDS` if needed.
- **Always verify resource access in API endpoints.** Every endpoint that accepts a user/resource ID from URL params must validate the authenticated user has access. For own-user resources: compare with auth userId. For coach-athlete resources: use `verifyAthleteBelongsToCoach()`. Never trust IDs from URL params without authorization check.

## Commit Convention

Conventional commits enforced via commitlint:

```
feat|fix|docs|style|refactor|test|chore|revert|perf: subject in lowercase
```

Pre-commit hooks (lefthook): format → lint → check-types → commitlint. Pre-push runs build.
