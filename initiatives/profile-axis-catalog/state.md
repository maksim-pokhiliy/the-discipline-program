# profile-axis-catalog — state (the board)

**Updated:** 2026-06-24. **W2 (design A) is RE-APPLIED, MERGED (#313), and PROD-CONFIRMED working.** The #309→#311 incident is closed at the root: this time the VO cut shipped WITH the **PAC-1 data-migration** + a prod-snapshot dry-run (the **D-8** law). The 13 prod `byProfile` loads were rewritten `{name,values}`→`{axisId,label,values,binding}` (gender coords remapped `m/f`→`Male/Female`; the owner-identified `CAL` folded into the system Gender axis), one transaction + post-write re-validation 13/13; the catalog now holds exactly **2 axes** — system `Gender` (`cgender000000000000000000`, `binding=GENDER`) + plain `level` (`cmqrp2xdy0000sot4u5l3z5wq`, `binding=null`). Owner smoke confirmed: gender resolves from the typed column (no manual pick), design-A loads resolve. Cutover = Option A maintenance window (PAC-19); the ~64s deploy→backfill window saw zero traffic → zero real 500s. **W1 + W2 DONE; next = W3.** (Tangential earlier this day: observability fix **PR #312** — `fa357632`, prod-confirmed; memory `[[nextjs-serverless-di-observability]]`.)

## Board

| #   | Step                      | Status    | Pointer                                                                                                                                                 |
| --- | ------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Found + ontology lock     | ✅ done   | charter · decisions D-1/D-2 · journal 2026-06-22                                                                                                        |
| 1   | Catalog + admin           | ✅ merged | W1 — PR #304 (model+contract+endpoints+admin+carve-out+tests+docs; migration `20260622113153_add_profile_axes`)                                         |
| 2   | Coach binding (sacred-VO) | ✅ done   | W2 design A — built (#309), reverted on incident (#311), **RE-APPLIED + prod-confirmed (#313 → `a7ac9a63`)** with the PAC-1 backfill (D-8). 2 axes live |
| 3   | Athlete two-layer profile | ⬜ next   | curated picker over the catalog · write-back by binding · bulk `profileSelections` key migration (PAC-2) · likely PAC-17                                |

## Next action

**▶ W3 — athlete two-layer profile** (a fresh executor session; gate-light — no sacred-VO touch). Covers: the athletic-card curated picker over the catalog (`level`, future axes) · write-back by `binding` (human→`gender` column, catalog→`profileSelections` by `axisId`) · the bulk **PAC-2** `profileSelections` key migration (string-name→`axisId`) · likely **PAC-17** (inline-set a bound attribute from the session, decision-first — supersedes D-7's "no inline pick"). Confirm bound (`binding!=null`) axes are HIDDEN from the athletic-card picker (gender lives in the human card). Each step ships UI on mocks first.

## Open decisions awaiting ratification

- **(none open.)** D-7 (design A) RATIFIED + now re-applied. D-8 (re-apply law) ACTED. PAC-19 RESOLVED (Option A, executed). D-3 SUPERSEDED. The four-projection gate is DISCHARGED (`four-projection-recheck.md`, verdict STANDS). W3 may surface the curated-picker UX + the PAC-17 inline-bound-pick decision.

## Live carry-forwards (see deferred.md)

**W3:** PAC-2 `profileSelections` bulk key migration · PAC-12 W2↔W3 intermediate-red (on prod: **0 inert-risk** — the one athlete's only selections are gender-keyed, resolved from the typed column; W3 still re-keys the profile-card writes) · PAC-17 inline-set bound attribute (decision-first).
**Open (low / later):** PAC-3 masters/age · PAC-4 `ProfileAxisValue` table · PAC-5 per-coach scoping · PAC-6 cells UX · PAC-10 `library` context · PAC-11 `TagsInput` dedup · PAC-15 admin protected-row edit-VIEW · PAC-16 migration system-row skip edge.
**Closed:** PAC-1 (the byProfile backfill — DONE at the #313 cutover, 13/13) · PAC-7 (four-projection gate + cross-ref re-added) · PAC-8 (single NFKC law) · PAC-9 (tolerate-orphan) · PAC-13 (kg-carry) · PAC-18 (orphans reconciled — the migration is back in the repo + applied; the system Gender row is now the legit live axis) · PAC-19 (Option A executed).

## Gotchas a resuming session must know

- **W1 + W2 are LIVE on prod.** The `byProfile` VO is the flat design-A `{axisId,label,values,binding}`; the resolver branches on the snapshot's `binding` (`GENDER`→typed column, `null`→`profileSelections[axisId]`). Catalog = 2 axes (system `Gender` + plain `level`). Do NOT reopen D-7.
- **The system Gender row is now legit** (`cgender000000000000000000`, protected — admin shows it read-only via the design-A code). PAC-18 is closed (no longer an orphan: the migration is in the repo + applied; the row is the real system axis).
- **PAC-2 is the live W3 debt.** The resolver reads `profileSelections[axisId]`; legacy name-keyed picks are inert until W3 re-keys them. On prod today: only 1 athlete, gender-keyed only → 0 inert-risk. A NEW non-gender pick made before W3 would be inert — W3 closes this.
- **gender stays a typed column** (D-1) — the bound axis READS it, never stores a gender value in the catalog/`profileSelections`.
- **The backfill script is one-time + idempotent** (`packages/api-server/scripts/backfill-byprofile-reapply.ts`): re-running skips already-migrated loads. The original 13 loads were backed up at cutover (gitignored scratch). Not needed again.
