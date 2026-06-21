# 0042. Adopt Prisma Migrate (the project is now production)

- **Status:** Accepted
- **Date:** 2026-06-21
- **Deciders:** Maksim Pokhiliy
- **Tags:** `database`, `prisma`, `migrations`, `ci`, `deployment`

## Context

ADR-0019 deferred versioned migrations. The project ran on `prisma db push`
exclusively — no `prisma/migrations/` directory — because the database held no
production data and was freely recreatable via `db:push` + `db:seed`. ADR-0019
decision #1 named the exact trigger to revisit: _"First production deployment
with real user data → create the baseline migration, switch all scripts from
`db:push` to `prisma migrate deploy`, add `migrations/` to version control."_
Decision #5 (a DB-level CHECK constraint on `marketing_reviews.rating`) was
deferred to the same trigger.

That trigger has fired. As of 2026-06-21 the project is production: the
production Neon database is now treated as holding data that must not be lost.
Under `db push`, the next schema change that renames or drops a column would
silently drop it in production — no review artifact, no history, no rollback.
`db push` has become a liability.

One complication shapes the procedure: production and dev already have a full
schema applied by `db push`. A naive `migrate dev --name init` (as ADR-0019 #1
loosely suggested) would try to recreate existing objects on a populated
database. Adopting Migrate here requires _baselining_, not a from-scratch init.

## Decision

We adopt Prisma Migrate. `db push` is removed from every script — a clean break,
with no local escape hatch, since a lingering `db push` only re-introduces the
drift risk we are eliminating.

**Baseline (`0_init`).** `prisma/migrations/0_init/migration.sql` is generated
from the current schema via
`prisma migrate diff --from-empty --to-schema-datamodel` (no database, no shadow
needed). The four raw-SQL invariants previously applied by
`scripts/apply-sql-checks.ts` — `idx_single_head_coach`, `chk_review_rating`
(ADR-0019 #5's rating CHECK), `plan_enrollment_unique_active`,
`schemas_block_order`: partial-unique indexes and a CHECK that Prisma's DSL
cannot express — are folded into the tail of `0_init`, so the migration history
is self-contained. `apply-sql-checks.ts` and `prisma/sql/lms-checks.sql` are
deleted.

**Adopting on an existing database (production, dev).** Mark `0_init` as already
applied without running its SQL: `prisma migrate resolve --applied 0_init`. This
writes only the `_prisma_migrations` row; it touches no data. `migrate deploy`
then treats the baseline as applied and runs only future migrations. Fresh
databases (CI, a clean local) instead get the full `0_init` via
`migrate deploy` / `migrate reset`.

**Scripts.** api-server gains `migrate:dev` / `migrate:deploy` / `migrate:status`;
`db:reset` is now `prisma migrate reset --force`, which drops, re-applies all
migrations, and runs the seed automatically (the old "reset then a separate
`db:seed`" two-step is gone).

**CI.** The test job applies `migrate deploy` to its throwaway Postgres instead
of `db push`, validating the whole migration history on every run.

**Production apply.** A manual `workflow_dispatch` GitHub Action
(`.github/workflows/db-migrate.yml`) runs `migrate deploy` against production
with the `PRODUCTION_DATABASE_URL` secret (the DIRECT, non-pooler Neon URL — DDL
over the pgbouncer pooler is flaky). It is deliberately decoupled from Vercel:
the Vercel build stays `generate + next build` and never touches the database, so
a preview deployment can never mutate a shared schema. The workflow also triggers
automatically on push to `main` when a migration file changes (added 2026-06-21),
so a merged migration applies to production without a manual click; the
`workflow_dispatch` button remains for manual/replay runs. The migrate job (~30s)
normally finishes before the parallel Vercel build (~2-3 min), so an additive
table/column exists before the new code goes live; add required reviewers to the
`production` GitHub Environment to gate the auto-run if needed.

This supersedes ADR-0019 decisions #1 and #5. ADR-0019's other deferred
decisions (#2 Stripe PK, #3 soft-delete writes, #4 raw test client,
#6 pagination) are unaffected.

## Consequences

- **Positive:** schema changes are now versioned, reviewable SQL in git;
  `migrate deploy` is additive and idempotent and never drops on drift. The
  rating CHECK (ADR-0019 #5) is now enforced at the database. CI re-validates the
  migration history on every run.
- **Negative:** every schema change now needs a migration file
  (`pnpm db:migrate --name <x>`) — a step `db push` did not require. Authoring new
  migrations locally with `migrate dev` needs a shadow database, now wired via
  `shadowDatabaseUrl = env("SHADOW_DATABASE_URL")` (point it at a separate empty
  Neon branch; see `.env.example`). The baseline + password-reset migrations were
  authored via `migrate diff`, which needs no shadow.
- **Neutral / runbook:**
  - One-time, per existing database (production **and** dev): run
    `prisma migrate resolve --applied 0_init` against it (direct URL). Until this
    is done, `migrate deploy` would attempt to create already-existing tables.
  - Add `PRODUCTION_DATABASE_URL` (direct, non-pooler) as a GitHub Actions secret
    for the `db-migrate` workflow.
  - `db:reset` now auto-seeds via `migrate reset`.
  - Follow-up: the open `feat/password-reset` branch (#291) currently adds its
    table through the schema only (relying on the now-retired `db push`). Once
    this lands, that branch must add a migration for `app_password_reset_tokens`.

## Alternatives considered

- **`migrate deploy` inside the Vercel build command.** Rejected: the build is
  shared by preview and production deployments, so a preview build would apply
  migrations to whatever database its environment points at — schema mutation
  coupled to every build, across three apps. A dedicated, gated job is the
  correct seam.
- **Keep `db push`, add the CHECK constraint by hand.** Rejected: it does not
  solve the core liability — drift on the next rename/drop is still a silent
  production data loss with no history or rollback.
- **`migrate dev --name init` against production (ADR-0019 #1's loose wording).**
  Rejected: production is not empty, so that path tries to recreate existing
  objects. Baselining via `resolve --applied` is Prisma's documented procedure
  for an already-populated database.

## References

- ADR 0019: Database strategy — deferred decisions (this supersedes #1 and #5)
- Prisma docs: [Baselining](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining)
- Prisma docs: [db push vs migrate](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/mental-model)
