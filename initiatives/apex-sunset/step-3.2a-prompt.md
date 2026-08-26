# Step 3.2a — cutover prep: apex redirect, app-password action section, published-day backfill (apex-sunset P3.2a)

Invoke the `/feature` skill with everything below as its argument (calibre: **full**) and
run its pipeline: research → plan (STOP at the plan gate and report to the PLANNER session
that spawned you — not the repo owner) → implement → internal review → PR. This file is
skill INPUT, not a plan override; where it pins a live-verified fact, trust it over
guessing, and verify anchors against the tree.

## Mission

Everything the P3.2b DNS cutover needs in code and runbooks, deployed dormant BEFORE the
flip. Three deliverables, one PR:

1. **Apex redirect** — once the apex is a custom domain on the platform Vercel project
   (3.2b), every non-`/api/v1` request on `thedisciplineprogram.com` redirects to
   `https://www.thedisciplineprogram.com`; `/api/v1/*` stays on the platform (the shim).
2. **AS-22 — `ACTION REQUIRED — app password changes`** section in the users-import
   report: the athletes whose app password will NOT be their legacy password after the
   cutover, as an owner checklist, plus the runbook law.
3. **AS-13 — published-day content backfill**: a guarded script that fills the
   content-less pre-P1.3 `MobilePublishedDay` rows from a legacy dump export, so those
   days stop 404-ing after the flip.

The PROD runs are NOT yours (planner/owner at 3.2b). You ship code + tests + runbooks.

## Live-verified facts (2026-08-26 — AUTHORITATIVE)

**Routing.** `apps/platform/src/proxy.ts` matcher excludes `api` entirely
(`/((?!_next/static|…|api).*)`), so `/api/v1/*` never enters the edge role gate on any
host. The Vercel edge refuses Host≠SNI with 403, so the apex will be a custom domain of the
platform project (D-9) and requests arrive with `Host: thedisciplineprogram.com`. Today the
VPS serves an EMPTY 200 on the bare apex — nothing to preserve.

**vercel.json.** `apps/{admin,marketing,platform}/vercel.json` are byte-identical (five
security headers + `"regions": ["fra1"]`); `docs/runbooks/vercel-json.md` documents that
invariant and its `diff` check. No `redirects()`/`rewrites()` in `apps/platform/next.config.*`.

**Users import surface.** `packages/api-server/scripts/legacy-users-import{,-source,
-classify,-match,-plan,-apply,-report,-snapshot,-reconcile,-digest}.ts` + the shared
`script-target-guard.ts` (`--expect-host=` required in both modes, `--write` requires
`--expect-plan=<12 hex>`, unknown flags rejected, `host=` query param refused). The report
already has one owner-action section: `ADDRESS_CHANGE_HEADING = "ACTION REQUIRED — login
address changes"` in `-report.ts`, fed by the `login-address-changes` warning kind in
`-plan.ts`; the summary line carries `login-address changes N`. The marker column
`MobileLegacyIdentity.importedPasswordHash` = the hash the import itself last wrote (null
for attach rows, id 17 and the demo row); ATTACH rows keep their platform credential by
ratified design (runbook §"ATTACH … that person keeps their platform credential").

**Prod state of the attach set (read-only audit, ids only).** 7 identities carry no marker
and a platform credential: legacy ids 1/3/9/18/22/23/24. ALL seven accepted a platform
invite and typed their own platform password (the invite flow hashes it — `iam/invite-
token.ts`), all have an `AthleteProfile`, five log performed sessions on the web. Id 9 is
legacy-disabled (shim `isEnabled=false`). The owner (id 3) reproduced the consequence on
the Appetize stand: his legacy app password → 403 from the shim, because the shim checks
the platform credential. DECIDED (owner + planner, 2026-08-26): the platform credential
stays — overwriting a password seven people chose and use on the web is worse, and a
dual-credential login is a security hole. Consequence to manage, not to code around: from
the flip, the app password of these athletes = their website password; the reset path is
the website's "Forgot password".

**Snapshot ledger.** `MobilePublishedDay { linkId, scheduledDate @db.Date, legacyRowId Int
(NOT NULL), contentHash, isRestDay Boolean?, dailyProgram Json?, publishedAt }`,
`@@unique([linkId, scheduledDate])`, DB CHECK `rest_xor_program` (rest day ⇒ `dailyProgram`
NULL via `Prisma.DbNull`, program day ⇒ JSON present; the `Prisma.JsonNull` form is
REJECTED by the CHECK). `MobilePublishLink { channel GENERAL|INDIVIDUAL, legacyLevelId
Int?, legacyUserId Int?, athleteId?, planId }`. The shim read (`mobile-compat/get-
program.ts`) selects rows `isRestDay: { not: null }` ordered by `publishedAt desc,
legacyRowId desc`. The write path (`coaching/mobile-publish/publish-day.ts`) stores the
LEGACY row verbatim: `isRestDay: legacyRow.isRestDay`, `dailyProgram: legacyRow.dailyProgram
=== null ? Prisma.DbNull : toInputJson(legacyRow.dailyProgram)`, `legacyRowId: legacyRow.id`,
`contentHash: contentHash(toHashable(isRestDay, dailyProgram))` where `Hashable =
{ isRestDay: true } | { isRestDay: false; dailyProgram }` (`contentHash` =
`src/utils/hash.ts` sha256 over `stableStringify`; `toInputJson` = `src/utils/to-input-
json.ts`). So a backfill from the dump is shape-identical by construction — the snapshot IS
the legacy row.

**Prod numbers (read-only, 2026-08-26).** 254 ledger rows; **134 content-less** (`isRestDay
IS NULL`) across 6 links — GENERAL 77 / INDIVIDUAL 57 — dated 2026-06-22 … 2026-08-16, none
today or later. Every row published since P1.3 carries content natively.

**Legacy program tables (fresh snapshot `fresh_snap`, container `tdp-dump-verify`
127.0.0.1:5544, user postgres / password snap).** `general_programs(id int, scheduled_date
date, training_level_id int, is_rest_day bool NOT NULL, daily_program jsonb NULL)` — 682
rows, 2025-07-13 … 2026-08-30; `individual_programs(id int, user_id int, scheduled_date
date, is_rest_day bool NOT NULL, daily_program jsonb NULL)` — 356 rows. Rest day ⇔
`is_rest_day = true AND daily_program IS NULL` (231/682); program day ⇔ `false` + JSON whose
top-level key is `dayTrainings` (the wire shape). The users export recipe (`docs/runbooks/
legacy-users-import.md` §1: `psql -At -c "select coalesce(json_agg(row_to_json(u) order by
u.id), '[]'::json) from …"` into gitignored `.legacy-import/`) is the pattern to mirror.

## Design (planner-ratified — owner ok 2026-08-26)

### 1 — Apex redirect (`apps/platform/vercel.json` ONLY)

Add a `redirects` block with a host condition: `has: [{ type: "host", value:
"thedisciplineprogram.com" }]`, matching every path EXCEPT `/api/v1` and below (path-to-
regexp negative lookahead in the `source` param, e.g. `/:path((?!api/v1(?:/|$)).*)` plus a
bare `/` rule if the param form cannot match the root — verify the matching semantics in the
Vercel docs and cover BOTH cases in the test), `destination: https://www.thedisciplineprogram.com/:path`,
`permanent: true` (308 — a canonical-host redirect is permanent by nature; the app never
requests a non-`/api/v1` path, so nothing it does can be cached wrongly). The other two
`vercel.json` files stay byte-identical to each other; update `docs/runbooks/vercel-json.md`:
the invariant becomes "identical except the platform's apex `redirects` block", with the
`diff` recipe adjusted so it still outputs nothing when in sync.

Test (`apps/platform/src/__tests__/vercel-config.test.ts`, root runner `--project
platform`): parses the JSON, asserts the host condition, the www destination, permanence,
and that the source pattern's inner regex rejects `/api/v1`, `/api/v1/`, `/api/v1/auth/
signin`, `/api/v1/program?…` and accepts `/`, `/login`, `/api/v2/x`, `/api/v1x` (a literal
regex check on the pattern string — no new dependency). The LIVE routing check (`curl -k
--resolve thedisciplineprogram.com:443:<vercel-ip>` after the domain is added, before DNS
moves) is a 3.2b checklist item — write it into the cutover runbook (below), not into CI.

### 2 — AS-22 section in the users-import report

A new owner-action section, sibling of the address one: heading `ACTION REQUIRED — app
password changes`, summary-line count `app-password changes N`. Predicate, computed from the
plan (NOT from the action kind — on a refresh run the attach rows are REFRESH actions):
an export row with a credential whose stored platform credential will NOT equal the export
hash after the run AND whose identity carries no marker (`importedPasswordHash` null) —
i.e. the credential was never import-written: a platform-chosen password. Rows with a
marker that no longer matches the stored credential are NOT in this list (that is either
the AS-7 first-login re-hash — same password — or a later change; the script cannot tell
and must not claim); keep them where they are today (the existing `not-import-written`
warning wording), and say in the runbook why they are excluded. Withheld id 17 (`password:
null`, no credential to change) and rows outside the export (demo) are excluded. Each line:
legacy id, how it was matched originally if known (link / address — from the identity/
link, not from this run's action), whether the shim has it enabled. The report is
operator-only, so the display address may appear as the address section already does —
follow that section's exact PII posture, no more. Expected on the prod dry run at 3.2b:
`app-password changes 7` = ids 1/3/9/18/22/23/24. Plan digest (AS-20): unchanged for an
unchanged plan — the section is derived, not a new action; prove it with a test.

Runbook (`docs/runbooks/legacy-users-import.md`): a mandatory checkbox in the pre-cutover
fidelity check — "every athlete listed under app password changes has been told that from
the cutover the app password is the website password, and that the reset path is the
website's Forgot password; legacy-disabled rows noted" — and a paragraph explaining the
rule and why the platform credential wins.

### 3 — AS-13 backfill: `packages/api-server/scripts/legacy-days-backfill*.ts`

Same architecture and safety model as the users import — reuse `script-target-guard.ts`
verbatim (`--expect-host=` in both modes; `--write` requires `--expect-plan=<digest>` over a
canonicalized plan, recomputed inside the transaction, mismatch = refusal with zero writes;
unknown flags rejected), every layer exported behind `isDirectRun`, delete-free writer by
type, one transaction, whole-run abort on any conflict.

- **Source:** ONE JSON export file (`--source=`) holding both tables, produced by a mirrored
  `row_to_json` recipe (`{ "general": [...], "individual": [...] }` or two files — your call,
  documented); strict zod schema per table (the five columns above; an extra/missing column
  fails loudly).
- **Targets:** ONLY ledger rows with `isRestDay IS NULL`. Rows that already carry content are
  never read for writing and never touched — post-P1.3 rows are native truth (prod data
  inviolable).
- **Matching, per row via its link:** GENERAL → `general_programs` where `training_level_id
= link.legacyLevelId AND scheduled_date = row.scheduledDate`; INDIVIDUAL →
  `individual_programs` where `user_id = link.legacyUserId AND scheduled_date = …`. A link
  missing the id its channel needs = conflict. Two legacy rows for one (target, date) =
  conflict (data anomaly, never guess). Then cross-check `legacyRowId`:
  - equal → action `fill`;
  - different → action `fill-from-newer-row` (the legacy day was re-published after our
    ledger row was written — DELETE+POST minted a new id; the legacy row is what the athlete
    saw): write the content AND set `legacyRowId` to the legacy id;
  - no legacy row at (target, date) → warning `missing-in-legacy`, row left untouched (it
    404s today and keeps 404-ing — never invent content).
- **Write:** `isRestDay` from `is_rest_day`; `dailyProgram` = `Prisma.DbNull` for a rest day,
  else `toInputJson(daily_program)`; `contentHash` = EXACTLY what `publish-day.ts` computes
  for the same content — extract its `Hashable`/`toHashable` into a sibling module inside
  `coaching/mobile-publish/` and import it from both (planner-granted fence extension,
  limited to that extraction; `publish-day.ts` behaviour unchanged, its tests stay green).
  `publishedAt` untouched. A rest-day row with a non-null `daily_program`, or a program row
  with null JSON, in the export = conflict (the CHECK would reject it anyway — refuse before
  the transaction, not inside it).
- **Report:** `fill N · fill-from-newer-row N · missing-in-legacy N · already-filled (skipped)
N · conflicts N`, per-row lines with link channel + date + legacy id (never the program
  body), plan digest; nothing about hosts/DSNs, same scrubbing discipline as the import.
- **Tests:** AS-15 bar — every branch mutation-killable; classification per action/warning/
  conflict class; digest row-order insensitivity + material-change sensitivity; apply refuses
  on a stale pin with zero writes; XOR satisfied for both day kinds; hash parity asserted by
  calling the shared helper on the same content the publish path would store; already-filled
  rows provably untouched (row snapshot before/after). Plus the local vertical (below).
- **Runbook:** `docs/runbooks/legacy-days-backfill.md` — export recipe, rehearsal on a
  throwaway container, dry-run → review → pinned apply, the expected prod shape (`134` targets:
  GENERAL 77 / INDIVIDUAL 57, 6 links, 2026-06-22 … 2026-08-16), the post-cutover law (a
  re-run is harmless by construction — it only ever fills nulls — but the export must come
  from the FINAL dump), and a cross-link from the users-import pre-cutover section.

### 4 — Cutover runbook skeleton

`docs/runbooks/apex-cutover.md`: the 3.2b sequence as a checklist the planner/owner will run
— add the apex to the platform Vercel project (TXT `_vercel` + A), the pre-flip live routing
check with `curl -k --resolve` against the Vercel IP (redirect on `/`, 200 on
`/api/v1/trainingLevel/all`, 403 on a garbage-token `/api/v1/program`), TTL to 60 s, final
users sync (fresh dump → dry-run → owner review incl. the new section → pinned apply), the
days backfill (same shape), the DNS flip (apex A → Vercel, proxy off), cert issuance wait,
phone smoke (demo athlete + the owner's own account with the PLATFORM password), soak,
rollback (A → VPS, proxy on). Content only as far as this step verified it; mark the
Vercel-side specifics the owner will confirm in the dashboard as such.

## Deliverables

1. `apps/platform/vercel.json` redirect + `apps/platform/src/__tests__/vercel-config.test.ts`
   - `docs/runbooks/vercel-json.md` update.
2. Report section + summary count + tests + runbook law (`legacy-users-import.md`).
3. `legacy-days-backfill{,-source,-classify,-plan,-apply,-report,-digest…}.ts` (mirror the
   import's layering; share what is genuinely shared, do not fork the guard) + tests +
   `docs/runbooks/legacy-days-backfill.md` + the `Hashable` extraction.
4. `docs/runbooks/apex-cutover.md` skeleton.
5. Initiative docs close-out IN the PR: `state.md`/`journal.md`/`plan.md`/`deferred.md`
   (AS-13 → CLOSED-at-3.2a pending prod apply; AS-22 → section shipped, owner checkbox
   pending; 3.2a row → done pending merge).

## Acceptance gates (verify yourself before the PR)

- Script suites (users import, days backfill) + `mobile-publish` + `mobile-compat` slices
  green (per-package, fenced); platform project test for `vercel.json` green via the ROOT
  runner: `SKIP_ENV_VALIDATION=1 pnpm exec vitest run --project platform
src/__tests__/vercel-config.test.ts` (there is no `apps/platform` test script — the
  package filter silently no-ops).
- Local vertical on a fresh throwaway container (import runbook §2 recipe, `--memory=512m`):
  migrate deploy → seed two links (one per channel) + content-less rows + one content-bearing
  row → synthetic export → dry run → pinned apply → nulls filled, hashes equal the publish
  helper's, the content-bearing row byte-identical before/after, a `fill-from-newer-row` case
  moved `legacyRowId`, a `missing-in-legacy` row untouched → tamper the export → stale pin
  REFUSED with zero writes (row counts + hashes unchanged).
- Golden regression 43/43 (the backfill writes the table the shim reads — prove the read is
  unaffected): `scripts/legacy-harness-seed.sh` then `RUN_LEGACY_INTEGRATION=1
SKIP_ENV_VALIDATION=1 pnpm exec vitest run --project platform src/app/api/v1/` from the
  REPO ROOT.
- Mutation table against a COMMITTED baseline (the runner reverts with `git checkout --`).
- `dep:check` clean; type-check on the cone; `diff apps/admin/vercel.json
apps/marketing/vercel.json` still empty.
- Synthetic-fixtures-only sweep (both repos are PUBLIC): no real program text, addresses,
  hashes, hosts. Program bodies from the dump are the coach's content — `.legacy-import/`
  only, never a fixture.
- PR body: what/why + the owner checklist AS CHECKBOXES (review the next prod dry run's
  `app-password changes` list · confirm the backfill dry-run counts against the numbers
  above · tick the cutover runbook skeleton).

## Scope fence

- **Touch:** `apps/platform/vercel.json`, `apps/platform/src/__tests__/vercel-config.test.ts`,
  `packages/api-server/scripts/legacy-days-backfill*`, `packages/api-server/scripts/legacy-
users-import-{plan,report}.ts` (+ tests) and only what the section needs,
  `packages/api-server/src/endpoints/coaching/mobile-publish/` ONLY for the `Hashable`
  extraction, `docs/runbooks/{legacy-users-import,vercel-json,legacy-days-backfill,
apex-cutover}.md`, `initiatives/apex-sunset/*`.
- **Do NOT touch:** `apps/admin/vercel.json`, `apps/marketing/vercel.json`,
  `src/endpoints/mobile-compat/**`, `src/endpoints/iam/**`, `@repo/contracts`, Prisma
  schema/migrations (NO schema change in this step), lockfiles, CI, any UI, the demo trio.
- **Prod is out of your hands:** never point `DATABASE_URL` at prod, never read
  `.env.prod`. Dev Neon (standing-approved) + local containers only.

## Standing constraints

- Both repos are PUBLIC — zero secrets/PII/coach content in committed files; synthetic
  fixtures only.
- Prod data is INVIOLABLE; the writer stays delete-free by type; conflicts abort whole.
- No code comments; commitlint (subject lowercase, body ≤150, footer ≤100; long bodies via
  `git commit -F`); never `--no-verify`; branch from `main`, PR against `main`.
- Resource fence (WSL): heavy commands inside `systemd-run --user --scope -q -p
MemoryMax=4G -p MemorySwapMax=1G -- <cmd>`; vitest `--maxWorkers=2`; throwaway DB
  containers `--memory=512m`; one heavy command at a time. Docker from WSL needs
  `PATH="$PATH:/mnt/c/Program Files/Docker/Docker/resources/bin"` for pulls.
- `pnpm db:generate` after any schema-bearing branch switch (none expected here).
- Do NOT spawn subagents — they stall systemically on this host; research inline; never
  idle-wait. End every turn declaring where you left the tree (branch, clean/dirty).
