# profile-axis-catalog — state (the board)

**Updated:** 2026-06-24. **W2 (design A) was MERGED (#309) then REVERTED (#311) on a PROD INCIDENT; re-apply PENDING.** Timeline: W1 catalog+admin SHIPPED + merged (#304). W2 coach-binding built design A (gender = a `binding`-bound SYSTEM protected catalog axis; D-7 supersedes D-3's union), owner-accepted, MERGED (#309 → `201b82a8`) → **prod incident**: the merge cut the sacred `byProfile` VO `{name,values}`→`{axisId,label,values,binding}` as a HARD CUT but the **PAC-1 data-migration was never run** (owner-gated on the bet "prod near-empty") → the coach's real pre-W2 `byProfile` loads 500'd → **REVERTED (#311 → `a6373699`)** to stop the bleed. **The design (D-7, design A) stays RATIFIED — the revert was OPERATIONAL (a missing data-migration), NOT a design reversal; do NOT reopen it.** The re-apply law is **D-8**; the prod fallout is **PAC-18**; the open re-apply gate is **PAC-19**. (Tangential: this session also merged the unrelated observability fix **PR #312** — `fa357632`, prod-confirmed; memory `[[nextjs-serverless-di-observability]]`.)

## Board

| #   | Step                      | Status                 | Pointer                                                                                                                                                             |
| --- | ------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Found + ontology lock     | ✅ done                | charter · decisions D-1/D-2 · journal 2026-06-22                                                                                                                    |
| 1   | Catalog + admin           | ✅ merged              | W1 — PR #304 (model+contract+endpoints+admin+carve-out+tests+docs; migration `20260622113153_add_profile_axes`)                                                     |
| 2   | Coach binding (sacred-VO) | ⚠️ reverted — re-apply | W2 design A built + merged (#309 → `201b82a8`) → **prod incident → REVERTED (#311)**. Design RATIFIED (D-7); re-apply gated on PAC-19 + a MANDATORY PAC-1 migration |
| 3   | Athlete two-layer profile | ⬜ blocked             | needs W2 re-applied first — curated picker + write-back by binding + selections migration (PAC-2)                                                                   |

## Next action

**▶ Owner: decide PAC-19 (the re-apply ordering gate) → then a SEPARATE EXECUTOR session re-applies W2.** This planning session synced the board only. The re-apply is NOT a re-do from scratch — the design-A code is intact in git `201b82a8` (recover via cherry-pick / `git revert a6373699`); Review APPROVE / QA A / 0 CRITICAL still stand. What the re-apply MUST add over #309 (the D-8 law — the thing whose absence caused the incident):

1. **Resolve PAC-19 FIRST** — (A) maintenance-window (atomic deploy+migrate+backfill, accept a short blip) vs (B) read-tolerant transitional `loadSchema` (accept both shapes on read through the gap). Owner's call; `prod-data-inviolable` governs, not `aggressive-migration-no-bridge`.
2. **AUTHOR + DRY-RUN the PAC-1 data-migration** against a PROD SNAPSHOT before merge — rewrite existing `{name,values}` loads to the flat `{axisId,label,values,binding}` (probe `training_schema_rows.load->>'kind'='byProfile'`; `name∈{gender,sex}`→ the system Gender `axisId`, else find-or-create → `axisId`). This is the gate, not optional.
3. **Restore the migration `20260623083123_add_profile_axis_binding` BYTE-IDENTICAL** (checksum must match prod's already-applied record → `migrate deploy` skips it; re-authoring = abort). See PAC-18.
4. **Re-add the plan-editor-compose `D-BYPROFILE-AXIS` cross-ref** (reverted with #311).
5. Then W3 (athlete two-layer profile + the bulk `profileSelections` migration PAC-2 + likely PAC-17).

## Open decisions awaiting ratification

- **PAC-19 (the re-apply ordering gate)** — maintenance-window vs read-tolerant transitional `loadSchema`. The hard-cut VO flip has NO 500-free ordering by code alone. Owner decides before the re-apply session. (See `deferred.md`.)
- D-7 (design A) is RATIFIED — NOT open. D-3 (the union) is SUPERSEDED. The four-projection gate is DISCHARGED + restored (`four-projection-recheck.md`); its verdict STANDS.

## Live carry-forwards (see deferred.md)

**Re-apply gate (OPEN):** PAC-1 byProfile-load migration (ESCALATED — the unrun migration that caused the incident; now MANDATORY + prod-snapshot dry-run) · **PAC-18** prod schema/data orphans (the forward-only migration's enum/column/index/system-row physically in prod; harmless to reverted code, but the system Gender row is editable in W1 admin — **do NOT delete it**) · **PAC-19** the ordering decision · PAC-7 the plan-editor-compose cross-ref re-lands at re-apply.
**Scheduled:** PAC-2 `profileSelections` key migration (W3) · PAC-12 W2↔W3 intermediate-red (DORMANT until re-apply) · PAC-17 inline-set bound attribute (W3, decision-first).
**Open (low / later):** PAC-3 masters/age · PAC-4 `ProfileAxisValue` table · PAC-5 per-coach scoping · PAC-6 cells UX · PAC-10 `library` context · PAC-11 `TagsInput` dedup · PAC-15 admin protected-row edit-VIEW · PAC-16 migration system-row skip edge.
**Closed (W2 design):** PAC-7 gate · PAC-8 (single NFKC law via snapshot + bind-by-`axisId`) · PAC-9 (tolerate-orphan) · PAC-13 (kg-carry).

## Gotchas a resuming session must know

- **The design is NOT the problem — do NOT reopen D-7.** Design A (gender = a `binding`-bound system axis, flat VO) is RATIFIED, built, reviewed, QA'd (0 CRITICAL), and intact in `201b82a8`. The revert was purely because the VO cut shipped without the PAC-1 data-migration (prod 500s). Re-apply = the SAME code + the migration + a safe ordering.
- **PROD carries W2 orphans (PAC-18).** The `20260623083123` migration is applied on prod (forward-only); the revert deleted only the FILE. So prod has the `binding` column + `app_profile_axes_binding_key` index + the `ProfileAxisBinding` enum + the system Gender row (`cgender000000000000000000`) + the `_prisma_migrations` record — none in the repo. Harmless to reverted code. **Do NOT delete the orphan system Gender row from the W1 admin** (its INSERT won't re-run → the re-apply would lack the system axis). Restore the migration byte-identical at re-apply.
- **planner work does NOT connect to prod.** Re-confirming the prod `_prisma_migrations` + orphan state is an owner/executor probe at re-apply, not a planner step.
- **gender is NOT in the catalog as data** (D-1) — typed column; the bound axis READS it. The bound arm is `binding="GENDER"`; plain coach axes are `binding=null`.
- **The lms resolver never reads `ProfileAxis`** — design-A resolver branches on the load snapshot's `binding` (`api-server-lms-no-coaching` holds). This is unchanged across the revert/re-apply.
