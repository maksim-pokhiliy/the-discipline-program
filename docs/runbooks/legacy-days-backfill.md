# Runbook — legacy published-day backfill

Fills the content-less rows of `MobilePublishedDay` from an export of the legacy program tables, so
that after the cutover the shim can serve the days it currently has nothing but a pointer for.

Script: `packages/api-server/scripts/legacy-days-backfill.ts`. Dry run by default; writing takes two
more flags. It never creates a row, never deletes one, and never touches a row that already carries
content — the writer it is handed has no `create`, `upsert` or `delete` method at all.

## Why this exists

Until the publish path started storing the rendered day alongside the pointer to it, a published day
was recorded as `linkId + scheduledDate + legacyRowId` and nothing else. The legacy backend answered
for those days, so nothing was missing. After the cutover we are the only server, and a row with
`isRestDay IS NULL` is a day the shim reports as not-found — the athlete opens that date in the app
and sees nothing.

At the time of writing production holds **254** ledger rows, **134** of them content-less, across
**6** links (GENERAL 77 / INDIVIDUAL 57), dated **2026-06-22 … 2026-08-16**, none of them today or
later. Every row published since the content column landed carries its content natively.

## The safety model in one paragraph

The script reads a **JSON export file**, never a second database, so no legacy DSN is ever handled.
Its only connection is the platform DSN in `DATABASE_URL`, and writing to that requires
`--write --expect-host=<hostname> --expect-database=<name> --expect-plan=<digest>`, the host and the
database checked against the ones the DSN resolved to and the digest against the plan you reviewed. All writes happen inside one transaction,
and the whole run refuses if anything is in conflict — there is no partial apply and no override flag.
This is the users import's model, reused module for module. `--expect-host` and `--expect-database`
are both required in a dry run too -- a host attests to a _server_, and a rehearsal database sits on
the same host as the one you meant, differing only by the name at the end of the DSN; if the DSN
names a port, the host flag must name it too. A `host=` query parameter in the DSN is refused
whatever its case, and a DSN carrying a `host=` query parameter is refused outright, for the reasons written up in
`legacy-users-import.md`.

**"It only ever fills nulls" is enforced twice.** The read asks only for rows whose `isRestDay` is
null. The write is an `updateMany` whose `where` carries that same null, so if a day gained content
between the plan and the write — a coach publishing while the run is in flight — it matches nothing,
the update reports zero rows, and the whole transaction rolls back rather than overwriting what was
just published. Neither of those is a comment or a convention; they are a query and a predicate.

**The content is the legacy row, verbatim.** `isRestDay` comes from `is_rest_day`, the program from
`daily_program`, and the `contentHash` from the same helper the publish path uses
(`mobile-publish/day-content-hash.ts`), over the same shape. A backfilled day is indistinguishable
from one published normally. A rest day is stored as a database NULL, not a JSON null — the ledger's
`rest_xor_program` constraint rejects the latter.

**What the digest covers.** Every write and the decision behind it, keyed by the **day** it is
about: the channel, the legacy level or athlete it belongs to, the date, the row id before and after,
and the hash of the content. Row order cannot move it — both sides are sorted. What it deliberately
does **not** cover: the plan's name (presentation, so renaming a plan between the review and the
write cannot refuse an apply), the ledger row's own id (a cuid nobody can check against the report),
and the count of rows that already carry content (not a write). This differs on purpose from the
users import, whose canonical form does carry the platform user's id: there the id is the identity of
the person being written about, here the day is.

## 1. Produce the export

One file, both tables, from the restored dump container:

```
mkdir -p .legacy-import
docker exec -e PGPASSWORD=<password> -i <container> psql -U <user> -d <database> -At -c "
  select json_build_object(
    'general',    (select coalesce(json_agg(row_to_json(g) order by g.id), '[]'::json) from general_programs g),
    'individual', (select coalesce(json_agg(row_to_json(i) order by i.id), '[]'::json) from individual_programs i))
" > .legacy-import/legacy-days.json
```

Roughly 600 KB for the current dump. `.legacy-import/` is gitignored. **The export is the coach's own
programme text.** It may not be committed, pasted into a pull request, or copied anywhere off the
operator's machine — the same rule the users export lives under, for a different reason.

The schema is **strict**: exactly `id`, `scheduled_date`, `is_rest_day`, `daily_program` plus
`training_level_id` (general) or `user_id` (individual). An added or missing column fails the run
loudly rather than half-importing. The programme body is parsed with the same shape the shim serves,
and refused if the round trip would drop a field — all 665 bodies carrying content in the current
dump round-trip byte-stable, so a complaint here means the export is wrong, not the legacy row.

## 2. Rehearse on a local throwaway database

Never rehearse against a shared database.

```
docker run -d --name tdp-backfill-local --memory=512m \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=platform_local \
  -p 127.0.0.1:5547:5432 postgres:17-alpine

DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5547/platform_local" \
  pnpm --filter @repo/api-server exec prisma migrate deploy
```

Seed a link per channel, some content-less rows and at least one row that already carries content,
then:

```
cd packages/api-server
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5547/platform_local"
pnpm exec tsx scripts/legacy-days-backfill.ts --source=<absolute path> \
  --expect-host=127.0.0.1:5547 --expect-database=platform_local
pnpm exec tsx scripts/legacy-days-backfill.ts --source=<absolute path> \
  --expect-host=127.0.0.1:5547 --expect-database=platform_local \
  --write --expect-plan=<the digest that dry run printed>
```

Run it from `packages/api-server` with `pnpm exec`, not `pnpm --filter … exec`: the filter wrapper
swallows the guard's refusal message and prints only its own exit-code noise.

Worth proving by hand at least once, because none of it is covered by a unit test: the row that
already carried content is byte-identical afterwards including its `publishedAt`; the row with no
legacy day is untouched; a `fill-from-newer-row` moved `legacyRowId`; the stored hashes equal what
`dayContentHash` returns for the same content; and an apply pinned to a stale digest refuses with the
row counts unchanged.

## 3. Production

Same shape as the users import, and the production DSN comes from the same owner-held `.env.prod`:

```
cd packages/api-server
DATABASE_URL="$(env -u DATABASE_URL_PROD node -e "process.loadEnvFile('../../.env.prod'); process.stdout.write(process.env.DATABASE_URL_PROD)")" \
  pnpm exec tsx scripts/legacy-days-backfill.ts --source=<absolute path> \
    --expect-host=<hostname> --expect-database=<database>
```

Review the dry run, then re-run with `--write` and the `--expect-plan=<digest>` that report printed.
The hostname comes from your own record of the production database, never from `.env.prod` and never
from the script's output, which offers none.

Expect, on the summary line, something close to:

```
fill <n> · fill-from-newer-row <m> · missing-in-legacy <k> · already-filled (skipped) 120 · conflicts 0
```

with `n + m + k = 134` **when `conflicts 0`** -- a target that ends in a conflict is counted in none
of the three, so the three only add up on a clean run. `already-filled (skipped)` is the independent
cross-check: 254 rows total, 134 targets, so 120 rows the run never considered.

### The export must come from the FINAL dump

A re-run is harmless by construction — it only ever fills nulls, so a day filled by an earlier run is
not a target for a later one — but a day filled from a **stale** dump keeps whatever that dump held.
The legacy app is still being published to until the flip, so the order is: final dump → export →
dry run → owner review → pinned apply, in the same window as the final users sync
(`legacy-users-import.md`), and after it if you want one less thing in flight.

After the flip the legacy tables stop changing, so a later re-run off the final dump is still correct.
There is no un-fill: that is what the dry run and the pin are for.

## 4. Reading the report

The head is three lines: the counts, the digest, and nothing hidden below the fold.

- **FILL** — the legacy row on that day is the one the ledger already points at. The content is
  written; the row id does not move.
- **FILL FROM A NEWER LEGACY ROW** — the legacy day was re-published after our row was written, so
  the legacy row id is a new one (an individual re-publish deletes and re-creates, which mints a new
  id). The athlete saw the newer row, so the content **and** the row id move. The line prints
  `legacy row <old> -> <new>`.
- **MISSING IN LEGACY** — no legacy day exists for that link and date. The row is left exactly as it
  is. It answers not-found today and it will keep answering not-found; inventing content for a day
  the coach never published would be worse than an empty day.
- **CONFLICTS** — nothing is written while any of these stand.

Every line names the day as `<channel> <level|athlete> <id> · <date>` plus the plan the link belongs
to, and never the programme text. A ledger row belongs to a link, and two links can point at the same
channel and legacy target from different plans, which is why the plan's name is on the line.

| Conflict                                                  | What it means                                                                          |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `publish link carries no legacy id for its channel`       | a GENERAL link with no `legacyLevelId`, or an INDIVIDUAL one with no `legacyUserId`    |
| `several legacy rows sit on one day`                      | the legacy tables have no unique key on (target, date); two rows means a human decides |
| `export row is a rest day carrying a program`             | the export contradicts itself; the ledger's constraint would reject it either way      |
| `export row is a training day carrying no program`        | the one state the app cannot render — it crashes on it                                 |
| `export row's program is not the shape the app is served` | writing it would make the shim refuse the day rather than serve it                     |
| `export row's program carries fields we would drop`       | importing it would silently lose part of the coach's day                               |
| `duplicate row id in the export`                          | two rows share a primary key, which a dump cannot produce — a hand edit did            |

A conflict is either a contradiction inside the export or a link that cannot be matched. Neither is
something a backfill may resolve by choosing, so there is no `--allow-conflicts`.

## 5. After applying

- Re-run the dry run: `fill 0 · fill-from-newer-row 0`, and `already-filled (skipped)` grown by
  exactly what was filled.
- Open one of the backfilled dates in the app (or the Appetize stand) as an athlete on that link and
  confirm the day renders.
- The `missing-in-legacy` list is the honest residue: those dates were never published in the legacy
  app, and they stay empty.

## What CI does and does not cover

The unit layers, the classification, the digest, the report and the fact that the CLI boots on a
`DATABASE_URL` alone are all covered. **Nothing about the script against a real database is.** The
transaction, the roll-back on a zero-row update, the constraint accepting both day kinds and the
`publishedAt` staying still are only ever proven by the local rehearsal in §2. Run it before any
production apply.
