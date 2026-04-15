# 0022. Monorepo discipline — resolved findings and deferred items

- **Status:** Accepted
- **Date:** 2026-04-13
- **Deciders:** Lead Architect
- **Tags:** `monorepo`, `tooling`, `dx`

## Context

Section 8 of the Big Tech audit examined monorepo hygiene: package boundaries, version policy, turbo caching, test infrastructure, ESLint configuration, Storybook coverage, and dependency management. 16 original bullets + 3 new findings from exhaustive research.

Of these 19 items, 4 were already closed in section 1 (dependency-cruiser, api-server exports, auth peer deps, contracts in api-client), 2 turned out to be inapplicable (пшики), 10 are intentional design choices that don't warrant changes, and 3 are concrete config fixes.

## Decision

### Closed as пшик (claim not confirmed)

**@repo/ui wildcard exports.** The claim was `exports: { "./*": "./src/*.tsx" }`. Actual: `exports: { ".": "./src/index.ts" }` — single controlled barrel. No wildcard, no issue.

**AppRouterCacheProvider v15 path.** MUI v7 (`@mui/material-nextjs@7.3.6`) only ships `v15-appRouter`. No v16 variant exists. Next.js 16 is backward-compatible with the v15 integration path.

### Intentional design choices (no change needed)

**Single version policy.** pnpm catalog uses exact versions for infrastructure (next, prisma, next-auth, typescript) and caret for libraries (react, MUI, zod). This is standard practice — infrastructure pins prevent breaking changes in CI, libraries allow patch updates.

**syncpack.** Not installed. The catalog pattern + `workspace:*` protocol provides sufficient version governance at current scale (12 packages). Trigger: >20 packages or first version drift incident.

**Two icon libraries.** `lucide-react` in marketing only, `@mui/icons-material` in admin/platform. Different design systems for different audiences — marketing uses custom landing page design, admin/platform use MUI. Not inconsistency, deliberate choice.

**@repo/shared scope.** 14 files, each ≤66 lines, no circular deps. Splitting into micro-packages (@repo/money, @repo/dates) adds workspace overhead without benefit. Current barrel is clean and focused. Trigger: second consumer package whose needs diverge from the current set.

**vitest through root, not turbo.** `vitest.workspace.ts` coordinates 2 test packages (api-server, contracts). turbo orchestration would add configuration overhead with no parallelization benefit — vitest already runs all suites in parallel.

**pre-commit type-check hangs.** Observed intermittently on Windows with Neon cold-start timeouts. CI uses local postgres container (no Neon). Not reproducible consistently enough to fix. Workaround: retry. Trigger: consistent reproduction.

**eslint-plugin-only-warn.** Converts errors to warnings, then `--max-warnings 0` makes them blocking. Effect: IDE shows yellow instead of red. Functionally identical to errors in CI. Removing the plugin changes nothing except IDE color. Not worth the churn.

**Storybook = MUI theme catalog.** Stories test MUI theme tokens (colors, typography, spacing) on raw components. @repo/ui components are tested through app-level usage. Adding @repo/ui stories is valuable but not a hygiene issue. Trigger: new developer onboarding.

### Concrete fixes (implemented in 8.2.A)

**lefthook test not filtered.** `pnpm test` ran all 240 tests on every commit regardless of changes. `lint` and `check-types` already use `--filter="...[HEAD]"`. Fixed: test now uses turbo filtering.

**@repo/env missing `"type": "module"`.** All 11 other packages declare it. Fixed: added for consistency.

**turbo.json lint cache:false.** `check-types` was cacheable, `lint` was not. Both are stateless validation tasks. Fixed: removed `cache: false` from lint.

## Consequences

- **Positive:** 16 of 19 bullets closed without code changes — either already done, пшик, or intentional. 3 concrete config fixes improve DX (faster pre-commit, consistent module type, lint caching).
- **Negative:** None. No architectural changes.
- **Neutral:** Deferred items (syncpack, shared split, storybook @repo/ui stories) have documented triggers. Future sessions check triggers, not re-audit.

## References

- ADR 0002: Monorepo with Turbo (original tooling decision)
- `.dependency-cruiser.cjs`: 23 boundary rules (section 1 deliverable)
- `docs/BOUNDED-CONTEXTS.md` §9: dependency direction rules
