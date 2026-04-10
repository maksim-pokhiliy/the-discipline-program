# 0002. Monorepo with Turborepo

- **Status:** Accepted
- **Date:** 2026-04-10
- **Tags:** `build-system`, `monorepo`, `tooling`

## Context

The project ships three Next.js applications (`admin`, `marketing`, `platform`) and one Storybook catalog from a single repository, backed by a shared set of internal packages (`@repo/contracts`, `@repo/api-server`, `@repo/api-routes`, `@repo/api-client`, `@repo/auth`, `@repo/ui`, `@repo/mui`, `@repo/query`, `@repo/shared`, `@repo/errors`, `@repo/env`, `@repo/eslint-config`, `@repo/typescript-config`). These packages are consumed by the apps through `workspace:*` protocol, not through publishing.

The core requirement for the build system is:

1. **Cache-aware task orchestration.** Running `pnpm check-types` at the root should only re-check packages whose inputs changed (and their dependents), not the whole graph. Same for `build`, `lint`, `test`.
2. **Dependency-aware scheduling.** `pnpm build` should build `@repo/contracts` before `@repo/api-server`, which must precede any app — automatically, without a hand-maintained order.
3. **Remote caching.** CI reruns on the same commit should be free.
4. **Zero-config for simple cases.** Every package has the same four scripts (`build`, `lint`, `check-types`, `test`) and the build system should understand them without per-package boilerplate.
5. **Next.js and pnpm workspace native support.** No custom adapters or glue code.

Without a build orchestrator, a monorepo this size devolves into either an N-script shell loop that rebuilds everything every time, or a hand-maintained `makefile` that drifts. Both options are hostile to a four-app, thirteen-package layout.

## Decision

We use Turborepo as the task runner and build orchestrator. Configuration lives in `turbo.json` at the root, and package scripts are kept shallow — the per-package `build` / `lint` / `check-types` / `test` scripts do the real work, and Turbo only orchestrates them.

Key conventions:

- Task graph and dependencies declared in `turbo.json` (`build` depends on `^build`, `check-types` depends on `^check-types`).
- `globalEnv` in `turbo.json` lists the environment variables that invalidate caches.
- `dev` and `lint` are marked `cache: false` (dev is persistent; lint writes to source and is hard to cache safely).
- pnpm is the package manager, pinned through `packageManager` in the root `package.json`. Catalog protocol (`pnpm-workspace.yaml`) enforces a single version per dependency across the monorepo.
- Remote caching is enabled through Vercel (same vendor as the deploy target).

## Consequences

**Positive:**

- Incremental CI: a PR that only touches `apps/marketing` skips check-types on unrelated packages.
- Build graph is derived automatically from `workspace:*` edges. Adding a new dependency between packages does not require updating any Turbo config.
- Native Next.js support means `apps/*` work with no glue.
- The catalog protocol in pnpm removes an entire class of "why is React 19.0.1 here and 19.2.3 there" problems.
- Local dev is one command (`pnpm dev`) and starts every app.

**Negative:**

- Turbo is a Vercel-owned project. Strategic lock-in risk — if Vercel deprecates or paywalls features, we migrate. Mitigated by Turbo's config being essentially a task graph, not a deep framework, so a migration to Nx or Moon would be a few days of work, not a rewrite.
- Remote cache requires Vercel auth in CI. One more moving part.
- Turbo's error messages are sometimes cryptic when a downstream task fails. Workaround: run the failing script directly (`pnpm --filter <pkg> build`) for a clean stack.
- Turbo major version bumps have historically broken `turbo.json` schema (v1 → v2 was a substantial migration). Budgeting future upgrade work is non-zero.

**Neutral:**

- The `turbo.json` `globalEnv` list must be kept in sync with `@repo/env` schemas. A missing entry silently invalidates caches or, worse, lets builds succeed locally and fail on Vercel. We have already hit this once (commit `cab4fe1`).
- The monorepo boundary is strict: code that must be consumed by apps lives under `packages/`, period. No ad-hoc scripts in app directories that reach across the tree.

## Alternatives considered

**Nx.** The main alternative. Nx offers richer generators, a more opinionated project graph, and deeper plugins for Next.js and Jest. It is also heavier, more opinionated than we want, and introduces its own `project.json` layer on top of `package.json`. We rejected it because the project does not need generators (we write code, not scaffold it), and because Nx's cross-repo affordances are overkill for a single-repo, single-team setup. Nx would also slow down onboarding: a new developer has to learn "what Nx thinks the graph is" in addition to "what pnpm says the workspace is". Not a bad tool, just wrong tool for this stage.

**Rush.** Microsoft's monorepo tool. Strong at extremely large monorepos (hundreds of packages, multiple teams, strict change-file workflows). Our repo is thirteen packages and one team. Rush's change-file model is a chore at this scale. Rejected as overkill.

**Moonrepo (moon).** Rust-based, newer, genuinely interesting for its task-runner ergonomics. Rejected for now because it is less battle-tested against Next.js + pnpm + Prisma in production. Worth re-evaluating in twelve months.

**Lerna.** Legacy. Effectively abandoned before its revival under Nx's maintenance. Rejected: there is no reason to start a new project on Lerna in 2026.

**pnpm workspace + Make / shell scripts, no orchestrator.** Simplest. Zero vendor lock-in. Also zero incremental builds, zero remote caching, zero automatic task graph. Works for a two-package repo, breaks down at thirteen. Rejected.

**pnpm workspace + `pnpm --filter=...` manually.** This is what we would fall back to if Turbo disappeared. It works — pnpm's filter protocol is powerful — but the developer has to remember what to filter by, and CI has to reconstruct the graph every run. Acceptable fallback, not the first choice.

## References

- `turbo.json` — the active configuration.
- `pnpm-workspace.yaml` — workspace layout and catalog.
- `package.json` scripts — root-level task entry points.
- https://turbo.build/repo/docs — Turborepo documentation (owned by Vercel).
