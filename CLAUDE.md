# the-discipline-program

**Type:** Monorepo (pnpm workspaces + Turborepo)
**Package manager:** pnpm 10.33
**Dominant stack:** Next.js 16 (App Router) + React 19 + MUI 7 + Prisma 6 + TanStack Query 5 + Storybook 10

## Workspace structure

### apps/

- `admin` — Next.js, port 3002 (internal console)
- `marketing` — Next.js, port 3000, +framer-motion (public site)
- `platform` — Next.js, port 3001, +@dnd-kit (product)
- `storybook` — Storybook 10 + @storybook/nextjs-vite

### packages/

- `api-server` — Prisma 6 owner (schema + client); root db-scripts уходят сюда через `--filter @repo/api-server`
- `api-client`, `api-routes`, `contracts`, `query` (TanStack wrappers)
- `auth` (next-auth 4), `env` (@t3-oss/env-nextjs), `errors`
- `mui` (theme), `ui` (components), `shared`
- `eslint-config`, `typescript-config`

## Commands (root)

- Install: `pnpm install` / `task install`
- Dev all (turbo): `pnpm dev` / `task dev`
- Build all: `pnpm build` / `task build`
- Lint: `pnpm lint` / `task lint`
- Type-check: `pnpm check-types` / `task check-types`
- Unit tests (Vitest): `pnpm test` / `pnpm test:coverage` / `task test`
- Prisma: `pnpm db:generate` | `db:migrate` (dev) | `db:deploy` (prod) | `db:reset` | `db:seed`
- Bundle analyze: `pnpm analyze:{admin,marketing,platform}`
- Dep boundaries: `pnpm dep:check` (dependency-cruiser)

## Working within a specific app/package

`cd apps/<name>` + local scripts, или `pnpm --filter <name> <script>` из корня.

## Stack notes

- pnpm catalog в `pnpm-workspace.yaml` для единых версий.
- Turbo pipelines кэшируют `build/check-types/lint`; `dev/test` некэшируемые (см. `turbo.json`).
- Pre-commit: check-secrets + lint-staged; commit-msg: commitlint; pre-push: dep:check + lint + check-types (cone, `...[origin/main]`).
- Taskfile (`taskfile.dist.yml`) обёртка над pnpm — `task *`.
- Sentry (`@sentry/nextjs`) + Vercel Analytics/Speed Insights + Upstash ratelimit/redis.

## Rules for Claude

- Don't read files listed in .claudeignore.
- Before multi-file / cross-package changes — output a plan first, wait for approval.
- Big features are run as **initiatives** (`initiatives/<slug>/`); the active slug is in `initiatives/ACTIVE` and a SessionStart hook force-loads its `state.md` board. Files: `charter` (goal/scope) · `plan` (roadmap) · `state` (the board + next action) · `decisions` (D-numbered ratified calls + rationale — the SSOT for "why") · `deferred` (carry-forwards/WARNINGs + disposition) · `journal` (append-only) · design docs. **Resume:** `/initiative-resume` (charter → state → decisions OPEN → deferred OPEN → plan). **Close out:** `/initiative-close` — promote every ratified decision → `decisions.md` and every carry-forward → `deferred.md`, then update board/journal/plan, one docs commit. **Promotion rule (non-negotiable):** nothing load-bearing stays only in gitignored `.feature-dev/` or an external chat — distil it into the initiative at every gate. Cross-initiative architecture calls → `docs/adr/`; planner read/verify-then-spec checklists → `docs/planner-discipline.md`. See `initiatives/README.md`.
- Respect workspace boundaries: don't add deps to the wrong package; use `catalog:` versions.
- Don't run install/build/test at workspace level without confirmation.
- Test runs require approval gating. Per-package runs (`pnpm --filter <pkg> test`) are fine without approval. The full root suite (`pnpm test` / `task test` / `turbo test`) and ANY `@repo/api-server` test run (`pnpm --filter @repo/api-server test`, `pnpm test:integration` against it) require explicit user approval — both are long (~10 min serial for api-server) and burn the cache window.
- Don't modify lock files, Prisma migrations, or CI configs without confirmation. (.gitignore is freely editable — user granted standing permission 2026-06-27.)
- Be concise. Senior developer context. Russian for explanations, English for code.
