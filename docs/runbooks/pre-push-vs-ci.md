# Pre-push vs CI: scope rationale

## Pre-push (`.husky/pre-push`)

Runs locally before `git push`. Scope:

1. `pnpm dep:check` -- dependency-cruiser boundary rules (full repo, ~10s).
2. `pnpm turbo run lint check-types --filter='...[origin/main]'` -- ESLint + TypeScript on packages affected since branch-off (typically <60s).

Tests are **not** in pre-push.

## CI (`.github/workflows/ci.yml`)

Runs on every PR and push to `main`. Six parallel jobs:

- `check-types` -- full workspace `tsc --noEmit`.
- `lint` -- full workspace ESLint.
- `dep-check` -- full repo dependency-cruiser.
- `format-check` -- Prettier check on `**/*.{ts,tsx,md,json}`.
- `test` -- full Vitest suite incl. `api-server` integration tests against a fresh `postgres:16-alpine` (~10-12 min, serial per `project_api_server_serial_tests` memory).
- `build` -- production build for all three apps + Storybook.

## Trade-off

The api-server suite runs serially (`fileParallelism: false`) because parallel runs corrupt shared Prisma test fixtures -- this is a hard memory rule, not a placeholder. Running it in pre-push pinned developers for ~10 minutes per push on wide-radius branches.

The lift-to-CI choice:

- **Saves** ~10 min of local wall-clock per push.
- **Costs** a possible "push then realize CI broke" loop. Mitigation: type-check + lint still run pre-push, so the cheap classes of failure (type drift, eslint violations, dep-graph violations) still fail fast locally. Test failures are caught in CI, which runs in parallel with the contributor's next task.

For a single-maintainer cadence this is the right cut: CI is the gating step, not pre-push. If a second contributor lands and the "push, wait for CI" loop becomes a friction point, revisit -- but the answer is unlikely to be "put tests back in pre-push", it's more likely "shrink the api-server suite via better test factories" or "split api-server into shards".

## Bypassing

Don't. If pre-push complains, fix the underlying issue. Don't `--no-verify`. (See global rule on skip-flags.)
