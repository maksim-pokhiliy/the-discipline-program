# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠ BIG TECH AUDIT IN PROGRESS — READ BEFORE ANY WORK

A long-running architectural audit and refactor is active on this repository. The audit is structured as a living document with bullet-per-commit implementation across 12 sections.

**Before doing anything on this project, read in this order:**

1. `docs/BIGTECH-AUDIT.md` — the audit document, including the "Implementation plan (section 1)" table. The table lists every planned commit with status (`✅ Done`, `⏳ Next`, `Pending`) and commit hash. Find the first row that is not `✅ Done`.
2. `~/.claude/projects/-home-maksim-projects-contrib-the-discipline-program/memory/project_audit_in_progress.md` — the handoff entry point. Contains full workflow rules, rule file references, resume instructions, and the cleanup trigger for when the audit eventually closes.

**Non-negotiable rules for audit work:**

- One bullet from the audit = one commit. Never bundle, never split without strong reason.
- Research for a section is exhaustive — the stop condition is "files for that section ran out", not "I have enough findings".
- Audit bullets are never deleted for "low impact" / "minor" / "cosmetic" reasons. The only legitimate removal reason is code-level proof that the concern is not real.
- New findings discovered during research are added to `docs/BIGTECH-AUDIT.md` as bullets before implementation starts — never kept only in chat.
- Technical decisions (commit granularity, file layout, refactor order) are made solo at FAANG staff+ level. Business decisions are escalated with a concrete recommendation.

**When the audit closes** (all 12 sections marked complete in the progress tracker), remove this block from `CLAUDE.md`, remove the `⚠ ACTIVE WORK` entry from `MEMORY.md`, and delete `project_audit_in_progress.md` from memory. The cleanup ritual is part of the audit's own definition of done — do not skip it.

## Project Overview

**The Discipline Program** — High-Performance Coaching Platform (LMS + Billing) with Marketing CMS.
Monorepo architecture using Turbo, Next.js 16, TypeScript, PostgreSQL + Prisma.

**Philosophy:** Quality > Speed. No deadlines. Clean and strong solutions over fast ones.
Don't be afraid to break and rebuild if necessary.

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
- **MUI-consistent sizing and spacing.** Never use raw pixel strings (`"24px"`, `"0.75rem"`) for spacing, sizes, or dimensions in `sx` props. Use `theme.spacing()` or MUI's numeric spacing shorthand (`p: 2`, `mr: 1`). For widths/heights, use theme spacing units or responsive breakpoints. For font sizes, use MUI Typography variants, not custom sizes. Exception: one-off decorative values (border-radius) where no MUI token exists. `letter-spacing` and `textTransform` must live in theme typography variants, not inline.
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
- **Inline editing: blur = commit.** Inline inputs commit on blur only. No Enter handler (unnecessary code — blur already fires on focus loss). No Escape-to-cancel — users expect the field to just save what they typed. Keep it simple: edit → leave → saved.
- **No optimistic updates for confirmed destructive actions.** Mutations behind a `ConfirmationModal` must NOT use optimistic cache updates. The optimistic removal unmounts the component → the modal disappears before the request completes. Use `onSuccess` → invalidate instead, so the modal shows loading → request completes → modal closes → UI updates.
- **No `as` casts for Prisma→Contract enum conversion.** Never cast Prisma enum types to contract types with `as`. Use the type-safe mapping Records from `mappers/enum-maps.ts` (e.g., `UNIT_MAP[prismaValue]`). If TypeScript can't verify the mapping, add a new entry to enum-maps — don't bypass the compiler.
- **Soft-delete through the Prisma extension only.** Never manually set `deletedAt = new Date()` or check `deletedAt` in queries. The soft-delete extension in `db/client.ts` handles filtering and deletion for all registered models. Use `prisma.model.delete()` — the extension intercepts it. To add a new soft-delete model, add it to `SOFT_DELETE_MODELS` in client.ts and add unique fields to `SOFT_DELETE_UNIQUE_FIELDS` if needed.
- **No inline sizing overrides on MUI components.** Never override `fontSize`, `padding`, `minHeight` via `sx` to make a component bigger/smaller — use MUI's `size` prop. Per-instance sizing kills consistency and creates N different "large" buttons across the app.
- **No custom MUI size/variant extensions.** Don't add custom sizes (`xlarge`) or variants via module augmentation when MUI already provides standard options (small/medium/large). Override the existing sizes in the theme to match the design system. Custom extensions add complexity and diverge from MUI conventions.
- **No per-instance button styling.** Never override `backgroundColor`, `color`, `fontSize`, `padding`, or hover styles on MUI `Button` via `sx`. All button appearance must come from the theme (`variant`, `color`, `size` props). If the design needs a new look — add or adjust a theme-level variant/color, don't style individual buttons.
- **Always verify resource access in API endpoints.** Every endpoint that accepts a user/resource ID from URL params must validate the authenticated user has access. For own-user resources: compare with auth userId. For coach-athlete resources: use `verifyAthleteBelongsToCoach()`. Never trust IDs from URL params without authorization check.
- **No raw CSS grid in sx.** Use MUI `Grid` component instead of `display: "grid"` / `gridTemplateColumns` in `sx` props. Same principle as Stack vs `display: "flex"`.
- **No `boxShadow` in components.** All shadows are disabled at theme level (`shadows: Array(25).fill("none")`). Never add `boxShadow` in `sx` or inline styles. For focus rings, use `outline` properties instead.
- **No hardcoded copy in CMS-managed pages.** Marketing section titles, subtitles, and body text must come from the backend via page contracts, not be written as string literals in components. If a section needs text that doesn't exist in the contract — extend the contract and seed data first, then consume it in UI. Follow the data flow: DB → Contracts → API → UI.
- **`type` not `interface` for data shapes.** Use `type` keyword for component props, API types, and all data shapes. `interface` is only for class contracts and explicit declaration merging (e.g. MUI module augmentation). `type` is composable (`&`, `Pick`, `Omit`), `interface` is not.
- **Use route handler factories.** Never hand-write `NextResponse.json()` in route handlers. Use `createGetHandler`, `createGetByIdHandler`, `createPostHandler`, `createPutHandler`, `createDeleteHandler`, `createToggleHandler` from `@repo/api-routes`. Factories handle response formatting, error wrapping, and Zod validation consistently. If a route doesn't fit any factory — that's a smell; the factory set should be extended.
- **Use `createCrudHooks` for CRUD entities.** Never hand-write `useMutation`/`useQuery` for standard CRUD operations (list, getById, create, update, delete). Use `createCrudHooks` from `@repo/query`. For toggle operations, use `createToggleHandler` on the route side. Hand-rolled hooks drift in error handling, toast messages, and cache invalidation.
- **Validate API responses with Zod.** Every route handler must `.parse()` the response through its Zod schema before returning. Never return raw data from `api-server` — always validate the contract. This catches mapper bugs and schema drift at the API boundary, not in the client.
- **MUI `slotProps` not deprecated prop APIs.** Use `slotProps={{ paper: {...}, backdrop: {...} }}` — never the deprecated `PaperProps`, `ModalProps`, `BackdropProps`, `InputProps`, `InputLabelProps`. MUI deprecated the old capitalized prop pattern. `slotProps` is the forward-compatible API.
- **Stack layout props as component props.** `alignItems`, `justifyContent`, `spacing`/`gap`, `direction` are first-class Stack props. Never put them inside `sx`. Only non-layout CSS (`backgroundColor`, `borderRadius`, `py`, `px`) belongs in `sx`. Same for `flexWrap` — it's a Stack prop. Use Typography `noWrap` prop instead of manual `overflow: hidden; textOverflow: ellipsis; whiteSpace: nowrap` in sx.
- **App-specific code stays in the app.** Shared packages (`@repo/ui`, `@repo/shared`, `@repo/query`) must only contain code used by 2+ apps. App-specific components, navigation configs, query keys, and layout components belong in the app's `src/lib/`. If only one app imports it — it's not shared.
- **`findOrThrow` for database lookups.** Never write manual `findUnique` + null-check + `throw new NotFoundError`. Use `findOrThrow()` from `api-server/utils` — it encapsulates the pattern. Same for `findFirst`.
- **Wrap Prisma mutations in `handlePrismaError`.** Every Prisma `create`/`update`/`delete` call must be wrapped with `try { ... } catch (error) { return handlePrismaError(error, { entity }); }`. This converts Prisma-specific errors (unique constraint, not found) into domain errors (`ConflictError`, `NotFoundError`).
- **No unnecessary `"use client"`.** Only add the directive when the component uses hooks, event handlers, browser APIs, or Context. If a component only renders MUI components with static props — it's a server component. Unnecessary `"use client"` breaks server-side rendering and increases bundle size.
- **Typed `useFormContext<T>()`.** Never call `useFormContext()` without a type parameter. Always pass the Zod-inferred form type: `useFormContext<CredentialsSectionData>()`. Untyped form context loses all field name and value type safety.
- **`Record<EnumType>` not `Record<string>` for enum-keyed maps.** Config maps, color maps, label maps keyed by enum values must use the actual enum/union type as key: `Record<TrainingPlanStatus, ChipProps["color"]>`, not `Record<string, ...>`. TypeScript catches missing keys only with the real type.
- **`z.string().cuid()` for ID fields in Zod schemas.** Every `id` field in contracts must use `z.string().cuid()`, not bare `z.string()`. Validates actual format at the boundary, catches garbage IDs before they hit the database. Same for `userId`, `planId`, etc.
- **Form fields must show validation errors.** Every `TextField` and `Controller` in forms must have `error={!!fieldError}` and `helperText={fieldError?.message}`. A form field that silently swallows validation is worse than no validation at all.
- **Explicit return types on api-server endpoints.** Every function in `api-server/endpoints/` must have an explicit return type annotation using the contract type: `async (): Promise<AdminBlogPageData> => { ... }`. This enforces the contract at the source, not just at the route boundary.
- **Zod validation limits → entity constants.** Never use magic numbers (`.max(5000)`, `.min(1)`) directly in Zod schemas. Extract to entity constants: `TRAINING_PLAN_CONSTANTS.MAX_NAME_LENGTH`, `WORKOUT_CONSTANTS.MAX_CONTENT_LENGTH`. Limits must be defined once, reusable in both schemas and UI.
- **Export prop types from `@repo/ui` components.** Every shared component in `@repo/ui` must export its props type. Consumers need these types for composition, wrapping, and typing spread props. `export type StatsCardProps = { ... }`, not just the component.

## Commit Convention

Conventional commits enforced via commitlint:

```
feat|fix|docs|style|refactor|test|chore|revert|perf: subject in lowercase
```

Pre-commit hooks (lefthook): format → lint → check-types → commitlint. Pre-push runs build.
