# PAC-2: `profileSelections` key re-key migration

One-off, idempotent data migration that re-homes legacy `AthleteProfile.profileSelections` keys. Pre-W2 the keys were free-string axis **names**; the resolver and the inline picker read/write by `axisId`. This script re-keys name → `axisId` and drops dead gender keys.

- **Script:** `packages/api-server/scripts/backfill-profileselections-rekey.ts`
- **Pure transform (unit-tested):** `packages/api-server/src/utils/profile-selections-rekey.ts`
- **Template it mirrors:** `backfill-byprofile-reapply.ts` (the PAC-1 byProfile backfill)
- **Target table:** `app_athlete_profiles` (the `profileSelections` Json column only — NO schema change)
- **Decision:** D-8 (the W2 re-apply law — a VO/data change on a table with prod rows ships WITH a data-migration + a prod-snapshot dry-run; the #309 → #311 incident). See `initiatives/profile-axis-catalog/`.

## What it does, per key

Classified by `classifyKey` (`profile-selections-rekey.ts`):

- **already an `axisId`** (matches `/^c[a-z0-9]{24}$/`) → SKIP, kept verbatim (idempotent re-run).
- **gender token** (`gender` / `sex`, case-insensitive) → DROP **only if the profile's typed `gender` is set** (gender lives in the typed column, D-1). If `gender = null` and a gender-keyed selection exists → **FLAG**, never silently drop.
- **any other name** → find-or-create a `ProfileAxis` by `key = name`, re-key to `{ axisId: value }`. A name with no resolvable axis → FLAG.

Each re-keyed map is validated with `profileSelectionsSchema.safeParse`. A profile with an empty/invalid value is counted invalid.

## The gender-flag guard

This is the safety the whole script exists for (the #309 "near-empty bet" lesson). A gender-keyed selection on a profile whose typed `gender` is still `null` is **flagged for owner review, not dropped** — dropping it would lose the only record of that athlete's gender. Any flag blocks the write.

## Refusal contract

`--write` is **atomic and all-or-nothing across the batch**: if ANY profile is flagged or produces an invalid map, the script prints the plan, sets `process.exitCode = 1`, and writes **nothing** — one bad profile blocks the entire run. Fix the flagged data (or set the typed gender), then re-run.

## How to run

The DB target is `DATABASE_URL` in the gitignored `packages/api-server/.env`. Run from `packages/api-server` via `tsx` (no package.json script entry, same as the PAC-1 backfill).

**Dry-run (default — NO writes):**

```bash
cd packages/api-server
tsx scripts/backfill-profileselections-rekey.ts
```

Prints the audit (per-profile key classification + totals) and the per-profile plan (re-keys / drops / flags). Exit code is `1` if anything is flagged or invalid, `0` if every map is clean. The dry-run output **is** the artifact the owner reviews before cutover.

**Cutover (`--write` — OWNER-GATED):**

```bash
cd packages/api-server
tsx scripts/backfill-profileselections-rekey.ts --write [--backup-dir=./pac2-backup]
```

On `--write` (only when the dry-run is clean): writes a JSON backup of the originals to `--backup-dir` (default `.`), applies all profile updates in one `prisma.$transaction`, then re-reads and re-validates. A post-write invalid sets `exitCode = 1`. Find-or-create of catalog axes happens only under `--write` (dry-run uses placeholder cuids for the distinct-key check).

## Owner gating (D-8)

This script never connects to prod from CI or a build. The prod-snapshot dry-run and the prod cutover are **owner-gated**:

1. Owner takes a prod snapshot (or points the script at a prod-snapshot branch).
2. Owner runs the dry-run against it; reviews every FLAG.
3. Only on a clean dry-run does the owner run `--write` against prod.

No "merge then fix" — the cutover is a deliberate, reviewed step, not a deploy side-effect.

## Prod reality at authoring (2026-06-24)

1 athlete, gender-keyed only → 0 inert-risk → the migration just drops one dead gender key. Authored with the full D-8 discipline regardless — this is exactly the near-empty bet that caused #309.
