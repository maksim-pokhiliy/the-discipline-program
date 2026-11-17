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

A dropped unique index is not a dropped column, but the old code may still write through it: an
upsert names its key, and the write fails loudly with `42P10` on the new index until the merge
deploys. Such a write path is frozen for the window, like the catalog below (0.4a dropped
`marketing_page_sections_pageSlug_section_key`; the admin pages editor is its frozen path).

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
3. The step's freeze is in force: until the last step of this runbook nobody uses, in the admin,
   the write paths the step names. Two kinds: a write beside new columns lands with their defaults
   and no error says so (0.3 froze the products and prices catalog); a write through a dropped
   unique key fails loudly with `42P10` (0.4a freezes the admin pages editor; the catalog is free).
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
- the step's own read checks pass (0.4a: the six marketing pages, the admin pages list and one page
  editor opened; saving there is frozen);
- the step's consistency query returns what the step expects (storefront-billing 0.3 and 0.4a below).

Then merge. The workflow run the merge triggers finds nothing to apply.

## After the deploy

- The new code serves: the pages above load, and the step's browser checklist passes on
  production.
- The consistency query still returns what the step expects: nothing was written in the window.
- The migration is applied to the dev Neon database, which serves the Vercel previews and gets no
  automated migration: `DATABASE_URL=<dev direct url> pnpm db:deploy`. Until then the previews of
  the PR branch run the new code on the old dev schema, so whatever the migration adds fails
  there; expected, not a signal.
- The step's freeze ends.

A code rollback after an expand is safe for reads only while the old code's queries still return
the rows it expects. The old code finds every column it knows, but it cannot filter on a column it
does not know: when the expand adds a column that partitions rows (the `locale` of 0.4a), the old
readers return every partition and serve whichever row the plan finds first (main's readers, run
against the 0.4a schema with a `uk` row present, served the `uk` hero on the English about page).
Before such a rollback hide or remove the rows of the new partitions (for 0.4a:
`UPDATE marketing_page_sections SET "isActive" = false WHERE locale <> 'en'`), or roll forward
instead. It is not safe for writes. The old code knows nothing of the new columns, so whatever it
writes lands beside their defaults, exactly as in the window before the merge, and a write through
a dropped unique key fails loudly. A rollback therefore puts the step's freeze back until the
roll-forward, and the consistency check is repeated after it. Rows the new code has written since
carry defaults in the old columns, so check what the old code would show for them before rolling
back.

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

## storefront-billing 0.4a (cms locales expand)

The freeze is the admin pages editor: the old admin upserts a section through the dropped
`pageSlug_section` key and fails with `42P10` until the merge deploys. The catalog is free. The
consistency queries for the window between the dispatch and the first language the coach adds:

```sql
select count(*) from marketing_page_sections where locale <> 'en';
select code from marketing_locales;
select count(*) from marketing_page_sections;
```

Expected: `0`, one row `en`, and the same section count before the dispatch and after the deploy
(nothing was written in the window). Once the coach adds a language the first query stops being a
law.

## storefront-billing 0.4d3b (cms list row ids)

The migration `20261116120000_cms_list_row_ids` is data only: it gives an `id` to every list row of
the six list sections (`home:whyChoose`, `about:journey`, `about:credentials`, `faq:content`,
`offer:requisites`, `offer:terms`), a fresh one in English and, in another language, the English
row's at the same position unless that list already holds it. It changes nothing else, and it
refuses list row ids that are not text or that repeat inside one list.

The freeze is every section save in the admin pages editor: the old admin drops the `id` of an about
journey, about credentials, FAQ, offer requisites or offer terms row when it reads and when it writes a
section, so one English save of those sections in the window stores rows without an `id` again (the
home why-choose rows keep theirs). The editor stays closed from the dispatch until the deploy is
verified. The consistency queries for the window between the dispatch and the end of the freeze:

```sql
SELECT section_row."pageSlug", section_row.section, section_row.locale, count(*) AS rows_without_id
FROM "marketing_page_sections" AS section_row
JOIN (
  VALUES
    ('home:whyChoose', 'features'),
    ('about:journey', 'timeline'),
    ('about:credentials', 'items'),
    ('faq:content', 'items'),
    ('offer:requisites', 'items'),
    ('offer:terms', 'blocks')
) AS list_fields (section, field) ON list_fields.section = section_row.section
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(section_row.data -> list_fields.field) = 'array'
    THEN section_row.data -> list_fields.field
    ELSE '[]'::jsonb
  END
) AS list_row (element)
WHERE jsonb_typeof(list_row.element) = 'object'
  AND (jsonb_typeof(list_row.element -> 'id') IS DISTINCT FROM 'string' OR list_row.element ->> 'id' = '')
GROUP BY section_row."pageSlug", section_row.section, section_row.locale
ORDER BY section_row."pageSlug", section_row.section, section_row.locale;

select count(*) from marketing_page_sections;
```

Expected: no row right after the dispatch and none after the deploy, and the same section count. A
row listed after the deploy names a section that lost its ids in the window: one English save of that
section in the new admin gives them back. A row of another language saved by the old deployment
inside the window is not healed by an English save (it mints English ids only): the two `UPDATE`
statements of the migration, run again by hand, give it its ids while the English order is unchanged.

Rehearsed on a copy of production taken 2026-11-17 (fifteen migrations, 22 sections, one language):
three rows changed (about journey, about credentials, FAQ), ten ids minted, the three home why-choose
ids kept, every other key and every `updatedAt` identical, and a second run of the file updated
nothing.

After the deploy, before the first save: every admin tab opened before the deploy is reloaded or
closed, the coach's included. The admin serves with Skew Protection (its asset URLs carry `?dpl=`),
so a tab keeps the old bundle across navigations, while its saves reach the new server. An old bundle
does not know the row ids: when it saves a list section without them, the server mints fresh ids for
English rows, and the words another language holds for those rows no longer belong to any row; a
section of another language saved that way stores no list words and turns into a draft.
