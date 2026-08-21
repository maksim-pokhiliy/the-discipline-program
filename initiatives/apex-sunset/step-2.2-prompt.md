# Step 2.2 — identity reconciliation + credential marker + plan pinning (apex-sunset P2.2)

Invoke the `/feature` skill with everything below as its argument (calibre: **full**)
and run its pipeline: research → plan (STOP at the plan gate and report to the PLANNER
session that spawned you — not the repo owner) → implement → internal review → PR.
This file is skill INPUT, not a plan override; where it pins a live-verified fact,
trust it over guessing, and verify anchors against the tree.

## Mission

Close the three P2.2 obligations on the shipped users-import surface: **AS-12** (the
mirror-fidelity gate: no duplicate persons, links↔identities cross-consistent, mirror
provably equal to the legacy truth), **AS-19** (replace the bcrypt-cost heuristic for
credential restore with a durable marker column — the phase's ONE allowed migration),
and **AS-20** (pin the plan the owner reviewed to the plan that gets applied via a
mandatory `--expect-plan` digest). Plus one runbook law: post-cutover re-runs are
forbidden by default (`PUT /user` writes profile fields into the identity — a re-run
would overwrite live in-app edits). The PROD run is NOT yours: you ship code + tests +
runbook; the planner/owner run the prod migration (auto via `db-migrate` on merge) and
the prod re-run after merge.

## Live-verified facts (P2.1 prod stage, 2026-08-20 — AUTHORITATIVE)

**Prod state:** 20 `MobileLegacyIdentity` rows (legacy ids 1..24 → 19 rows, + demo
`990001`). 11 creates carry the legacy hash **byte-exact** in `User.password`; id 17
(`legacy-admin@thedisciplineprogram.com`) has `password: null`; the 7 attach rows
(ids 1/22/23 by address, 3/9/18/24 by INDIVIDUAL link) keep their platform credential.
Idempotent re-run: `create 0 · refresh 19 · conflicts 0`, ZERO mirror diffs, the 7
attach rows warning "platform credential kept". The import already produced zero
duplicate persons by construction.

**Script surface (all shipped in #376, 219 tests, every layer exported + isDirectRun):**
`packages/api-server/scripts/legacy-users-import{,-source,-classify,-match,-plan,
-apply,-report,-snapshot}.ts` + the shared `script-target-guard.ts` (40 tests).
`decidePasswordChange` in `-plan.ts` keys restore on the bcrypt-cost heuristic
(`readBcryptCost` from `src/endpoints/iam/bcrypt-cost.ts`) behind
`--restore-credentials`; deferred.md AS-19 records the heuristic is wrong in BOTH
directions. `ImportWriter` (`-apply.ts`) exposes only `user.create/update` +
`mobileLegacyIdentity.create/update` — keep it delete-free. The report renderer
prints NO hash, DSN, or hostname in any mode (mutation-bound tests exist).
`--expect-host` is required in BOTH modes; a `host=` query param is refused; unknown
flags are rejected (exact match for boolean flags).

**Rehearsal targets:** container `tdp-dump-verify` (127.0.0.1:5544, postgres/snap)
holds `prod_snap` (2026-08-07) and `fresh_snap` (2026-08-20) — 19 rows each; the
runbook's §2 recipe stands up a throwaway platform container (recreate it per the
runbook — do not reuse a stale one; a leftover `tdp-import-local` may carry a
different password than the recipe). Dev Neon migrations are standing-approved.

**AS-7 interaction (shipped, do not touch auth-service):** `validateUser` re-hashes a
cost-10 credential to cost 12 on first successful login (CAS-guarded, logs
`iam.auth.password_cost_upgraded`). Consequence for the marker design: an AS-7-upgraded
user's `User.password` no longer equals any legacy hash — they land in
"platform-managed" and restore correctly declines (they know their password; RF-10
documented this false-negative as accepted).

## Design (planner-ratified contour — owner ok 2026-08-21)

**AS-19 — marker column.** Migration adds `importedPasswordHash String?` to
`MobileLegacyIdentity` (nullable; null for attach rows, id 17, and the demo row).
Semantics: _the hash the import itself last wrote into `User.password`_.

- **create**: written alongside the credential (same transaction).
- **restore** (`--restore-credentials`): allowed ONLY when
  `identity.importedPasswordHash != null` AND `User.password ===
identity.importedPasswordHash` (nobody changed the credential since the import) —
  then write the new source hash to BOTH `User.password` and the marker. The
  bcrypt-cost heuristic is REMOVED from the import (`bcrypt-cost.ts` itself stays —
  AS-7 in auth-service uses it).
- **backfill on refresh**: when the marker is null and `User.password === source
hash` (exact equality NOW), set the marker to that hash — self-evidently safe (the
  user carries exactly the legacy credential, so a restore keyed on it changes
  nothing). When unequal → leave null, report "platform-managed" honestly.
- Update the warning wording/classes accordingly (no false provenance claims — say
  what the marker knows, not more).

**AS-20 — plan pinning.** The dry-run report prints a short digest (sha256 over a
CANONICALIZED plan: stable ordering by legacyUserId, actions + conflicts + warnings +
per-row material fields; truncate for display, e.g. 12 hex). `--write` REQUIRES
`--expect-plan=<digest>`; the apply re-classifies inside its transaction as today, then
refuses (nothing written) if the recomputed canonical digest differs. Digest must be
insensitive to source-file row order (canonicalize before hashing) and sensitive to
any material change (a credential, a mirror field, a class flip). The refusal message
explains: re-run the dry run, re-review, re-apply.

**AS-12 — reconciliation gate.** Build the cross-check INTO the classifier/report so
every run asserts it: for each INDIVIDUAL `MobilePublishLink` with non-null
`legacyUserId` + `athleteId`, the identity holding that `legacyUserId` (if present)
must point at that same user — a violation is a NEW conflict class (whole-run abort,
like every conflict). Add a RECONCILIATION line to the report summary (links checked /
consistent / violations). The runbook gains a "pre-cutover fidelity check" section:
fresh dump → export → dry run → expected `refresh 19 · conflicts 0 · mirror diffs 0 ·
reconciliation clean`; that report IS the AS-12 gate artifact.

**Runbook law (post-cutover):** after cutover the export is no longer the source of
truth — the app's `PUT /user` writes firstName/lastName/phone/DOB into the identity,
so a `--write` re-run would overwrite live athlete edits. State it as a hard rule in
the runbook: re-runs are pre-cutover tools; post-cutover only with an explicit,
justified decision.

## Deliverables

1. The Prisma migration (ONE additive nullable column). Author it via the project's
   normal `prisma migrate dev` flow against dev Neon (standing-approved; `pnpm
db:generate` after). The `prod-guard` hook blocks Write/Edit on
   `prisma/migrations/**` — the migration must be GENERATED by the Prisma CLI, not
   hand-written via the Write tool. If anything forces hand-authoring, STOP and
   escalate to the planner.
2. Marker logic in `-plan.ts`/`-apply.ts` (+ source of the marker in the snapshot
   read), heuristic removal, warning wording updates.
3. Digest module (canonicalization + sha256) + `--expect-plan` in the guard/entry
   (reuse `script-target-guard.ts` conventions: exact-match flag, `=`-flag parsing,
   repeated-flag throw, unknown-flag reject).
4. Reconciliation conflict class + report summary line.
5. Tests (AS-15 bar — every branch mutation-killable): marker policy (create writes
   it; restore allowed/declined on equality; backfill fires only on exact match;
   AS-7-upgraded row declines), digest (row-order insensitivity; material-change
   sensitivity; apply refuses on mismatch with zero writes), reconciliation (violation
   → conflict → whole-run abort), plus regression: the existing 219 script tests stay
   green (update the ones the heuristic removal touches — deliberately, not by
   loosening assertions).
6. Runbook updates: `--expect-plan` in every apply recipe, the pre-cutover fidelity
   check section, the post-cutover law, marker semantics in the safety model.
7. Initiative docs close-out IN the PR: state/journal/plan/deferred (AS-12 →
   disposition, AS-19/AS-20 → CLOSED-at-P2.2 pending prod verify).

## Acceptance gates (verify yourself before the PR)

- Full script suite + targeted iam/mobile-compat slices green (per-package, fenced).
- Migration applied to dev Neon; `pnpm db:generate`; type-check green on the cone.
- Local vertical on a fresh runbook-recipe container: migrate deploy → import a
  synthetic export with `--write --expect-host --expect-plan` → markers present for
  creates → tamper `User.password` manually → restore declines → restore the original
  → restore accepts with the flag → digest mismatch (edit the export between dry and
  apply) → REFUSED, zero writes (assert via row counts).
- Golden regression 43/43 (the migration touches the identity table the shim reads —
  additive nullable is expected safe; prove it): `scripts/legacy-harness-seed.sh` then
  `RUN_LEGACY_INTEGRATION=1 SKIP_ENV_VALIDATION=1 pnpm exec vitest run --project
platform src/app/api/v1/` from the REPO ROOT.
- Opt-in probe (`RUN_LEGACY_IMPORT_CHECK=1`) green with the new mandatory
  `--expect-plan` wired into its shell-out (keep the loopback assert).
- Synthetic-fixtures-only PII sweep (both repos are PUBLIC).
- PR body: what/why + owner checklist AS CHECKBOXES (review the prod re-run report's
  RECONCILIATION line · confirm markers backfilled · `credentials replaced 0`).

## Scope fence

- **Touch:** `packages/api-server/prisma/schema.prisma` + the ONE generated migration,
  `packages/api-server/scripts/legacy-users-import*` + `script-target-guard.ts` (+
  tests), `apps/platform/src/app/api/v1/__tests__/legacy-users-import.integration.test.ts`,
  `docs/runbooks/legacy-users-import.md`, `initiatives/apex-sunset/*`.
- **Do NOT touch:** `src/endpoints/iam/**` (AS-7 is shipped; `bcrypt-cost.ts` stays),
  `src/endpoints/mobile-compat/**`, `@repo/contracts`, lockfiles, CI configs, any UI,
  the shim-demo trio (AS-18 rides).
- **Prod is out of your hands:** never point `DATABASE_URL` at prod, never read
  `.env.prod`. Dev Neon (migrations, standing-approved) + local containers only.

## Standing constraints

- Both repos are PUBLIC — zero secrets/PII in committed files; synthetic fixtures only.
- Prod data is INVIOLABLE; the writer stays delete-free by type; conflicts abort whole.
- No code comments; commitlint (subject lowercase, body ≤150, footer ≤100; long bodies
  via `git commit -F`); never `--no-verify`; branch from `main`, PR against `main`.
- Resource fence (WSL): heavy commands inside `systemd-run --user --scope -q -p
MemoryMax=4G -p MemorySwapMax=1G -- <cmd>`; vitest `--maxWorkers=2`; throwaway DB
  containers `--memory=512m`; one heavy command at a time.
- `pnpm db:generate` after any schema-bearing branch switch.
- Do NOT spawn subagents — they stall systemically on this host right now; research
  inline.
