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
- Prisma: `pnpm db:generate` | `db:push` | `db:seed`
- Bundle analyze: `pnpm analyze:{admin,marketing,platform}`
- Dep boundaries: `pnpm dep:check` (dependency-cruiser)

## Working within a specific app/package

`cd apps/<name>` + local scripts, или `pnpm --filter <name> <script>` из корня.

## Stack notes

- pnpm catalog в `pnpm-workspace.yaml` для единых версий.
- Turbo pipelines кэшируют `build/check-types/lint`; `dev/test` некэшируемые (см. `turbo.json`).
- Pre-commit: husky + lint-staged + commitlint.
- Taskfile (`taskfile.dist.yml`) обёртка над pnpm — `task *`.
- Sentry (`@sentry/nextjs`) + Vercel Analytics/Speed Insights + Upstash ratelimit/redis.

## Rules for Claude

- Don't read files listed in .claudeignore.
- Before multi-file / cross-package changes — output a plan first, wait for approval.
- Respect workspace boundaries: don't add deps to the wrong package; use `catalog:` versions.
- Don't run install/build/test at workspace level without confirmation.
- Don't modify lock files, Prisma migrations, CI configs, or .gitignore without confirmation.
- Be concise. Senior developer context. Russian for explanations, English for code.
