# Applying a migration to production before the merge

Some migrations have to reach production before the code that needs them. This is the procedure:
the migration is applied from the PR branch, the code already in production keeps serving, and
only then the PR is merged. First used by storefront-billing step 0.3 (decision D-18 of that
initiative).

## Why the merge cannot do it

A merge to `main` starts the Vercel builds of the three apps and `.github/workflows/db-migrate.yml`
at the same moment, and nothing orders them. Prisma names every column it reads and writes, so:

- new code in front of an old schema fails on its first query;
- old code in front of a schema that lost a column fails the same way.

The window is minutes when both pipelines are healthy and unbounded when the migration fails.

## When this procedure applies

- The PR carries a migration under `packages/api-server/prisma/migrations/`.
- The new code reads or writes something that migration adds.
- The migration is an EXPAND: it adds and converts, and drops nothing the code in production
  still reads.

A migration that drops such a column is split first. The drop becomes a later step of its own, the
CONTRACT, which runs once the expand is live (see the last section).

## Rules for the migration file

- No `BEGIN` and no `COMMIT` anywhere in the file; Prisma applies it atomically by itself
  (`local-stack.md`, "Authoring a migration").
- The first statement is `SET LOCAL lock_timeout = '5s';`. It bounds every single lock wait of the
  migration to five seconds. A migration that cannot get a lock gives up after that wait with
  `55P03` and leaves nothing behind. While it waits, reads of that table queue behind it, for at
  most the same five seconds per wait; the timeout bounds each wait, not their sum. Measured
  2026-09-28 on the W0 file: a blocked apply failed after 5.9 s, the schema was unchanged, and it
  applied cleanly after `migrate resolve --rolled-back`.
- A guard that refuses data the conversion was not written for comes right after it.

## Before the dispatch

1. Every review round is closed. Production records the checksum of the file it applied, so after
   the dispatch the file is frozen and any change to the SQL is a new migration.
2. The final file was rehearsed on a clone of a production snapshot (`local-stack.md`,
   "Rehearsing against a production snapshot").
3. The catalog is frozen: until the last step of this runbook nobody creates or edits products and
   prices in the admin. The code in production does not know the new columns, so whatever it
   writes lands beside their defaults and no error says so.
4. Production has no long transaction open. The checks below are read-only and are run by the
   owner, or by the planner with the owner's word for that run:

```bash
cat > /tmp/check.sql <<'SQL'
select count(*) from pg_stat_activity
where state like 'idle in transaction%' and now() - xact_start > interval '30 seconds';
SQL
PGURL="$(env -u DATABASE_URL_PROD node -e "process.loadEnvFile('.env.prod'); process.stdout.write(process.env.DATABASE_URL_PROD)")" \
  docker compose exec -T -e PGURL db sh -c 'psql "$PGURL" -X -At -f -' < /tmp/check.sql
```

Expected: `0`.

## Dispatch

```bash
gh workflow run db-migrate.yml --ref <pr-branch>
gh run list --workflow db-migrate.yml --branch <pr-branch> --limit 1
gh run watch <run-id>
```

The apply itself takes well under a second on this database; the job is mostly install time. A
job still running after two minutes is cancelled and investigated.

If the job fails, nothing was applied. Read the database error in the job log, remove its cause,
mark the attempt (`prisma migrate resolve --rolled-back <migration>` against production, same
connection-string form as above) and dispatch again.

## After the dispatch, before the merge

Production still runs the OLD code on the NEW schema. Confirm it:

- the storefront (`/`, `/storefront`) and the contact page load;
- the admin products page loads;
- an athlete timetable loads on the platform;
- the step's consistency query returns what the step expects (for storefront-billing 0.3 see below).

Then merge. The workflow run the merge triggers finds nothing to apply.

## After the deploy

- The new code serves: the pages above load, and the step's browser checklist passes on
  production.
- The consistency query still returns what the step expects: nothing was written in the window.
- The migration is applied to the dev Neon database, which serves the Vercel previews and gets no
  automated migration: `DATABASE_URL=<dev direct url> pnpm db:deploy`.
- The catalog freeze ends.

A code rollback after an expand is safe for reads: the old code finds every column it knows. It is
not safe for writes. The old code knows nothing of the new columns, so whatever it writes lands
beside their defaults, exactly as in the window before the merge. A rollback therefore freezes the
catalog again until the roll-forward, and the consistency check is repeated after it. Rows the new
code has written since carry defaults in the old columns, so check what the old code would show
for them before rolling back.

## The contract step

Dropping what the expand left behind is a separate PR with its own migration. Before it:

- the expand is live and its browser checklist passed on production;
- no deployment that still reads the old columns is serving. A field that is merely unused is
  still read: Prisma names every declared column in its default selection and writes static
  defaults itself. The expand PR therefore marks the fields that will go with `@ignore`, which
  takes them out of the generated client without a migration, and proves it by running the tests
  of every reader against a database where the columns are already dropped;
- the old columns hold nothing the new ones do not explain. The step names the query.

The contract PR removes the fields from `schema.prisma` and drops the columns, and its migration
is dispatched before its merge like any other.

## storefront-billing 0.3 (W0 expand) and 0.3b (W0 contract)

Consistency query for the window between the dispatch and the first price written by the new
code. Every price must be an old price converted by the law of D-16:

```sql
select count(*) from app_prices
where "periodCount" <> 1
   or "periodUnit"::text is distinct from
      (case "interval" when 'MONTHLY' then 'MONTH' when 'YEARLY' then 'YEAR' end);
```

Expected: `0` before the merge and `0` right after the deploy. Once the freeze ends the new code
writes prices with their own periods, and the query stops being a law.

Before 0.3b drops `interval`: `select count(*) from app_prices where "interval" = 'ONE_TIME'`
returns `0`, and every price whose period differs from its `interval` was written by the new code
after the deploy.
