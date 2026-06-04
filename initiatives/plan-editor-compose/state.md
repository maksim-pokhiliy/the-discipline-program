# plan-editor-compose — state (the board)

**Updated:** 2026-06-04

A scannable board, not prose. The narrative lives in `journal.md`; the "why" in `decisions.md`; carry-forwards in `deferred.md`. This file = where we are + the one next action. **Resume here** (the SessionStart hook force-loads it).

## Board

| #        | Step                                                                                                                             | Status                                        | Pointer                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| 10.0     | Algebra spec                                                                                                                     | ✅ DONE                                       | `algebra-spec.md`                                                         |
| 10.1     | Compose prototype on mocks (canvas + axis-inspector + leaf editors + duplication)                                                | ✅ DONE — coach-walkthrough PASSED            | journal 2026-06-02; `feat/compose-prototype-10-1`                         |
| 10.2     | Contracts + schema freeze (axis contract, ladder-split, `.strict()`, additive `Schema.composition`)                              | ✅ DONE — contract FROZEN                     | journal 2026-06-03; `feat/compose-contracts-10-2`                         |
| 10.3     | Backend + seed-as-compositions (mapper read + tree-validation + dual-write + derived label + 5 Gauntlet seed trees)              | ✅ DONE — api-server 811/811                  | journal 2026-06-03; `feat/compose-backend-10-3`                           |
| **10.4** | **Destructive sweep + QA-001 write-guard** — the arc below                                                                       | 🔵 IN PROGRESS — **S1 done, S2 next**         | `10-4-recon.md`; D-10.4-1/2 RATIFIED, D-10.4-3 OPEN                       |
| ↳ S1     | QA-001 write-guard + QA-003 fold + nullable-archetype expand                                                                     | ✅ DONE — api-server **813/813**; **PR #241** | journal 2026-06-04; D-10.4-S1-RS, D-10.4-S1-INT                           |
| ↳ S2     | Productionize the prototype (converter + persistence + **read-shape widen + composition-only enable** + mounts + re-walkthrough) | ⏳ **next** (ratify D-10.4-3 at kickoff)      | `10-4-recon.md` MINE 2; `deferred.md` DR-1; D-EMOM-UX, D-CONTAINER-VS-ROW |
| ↳ S3     | Mechanical sweep (ultracode workflow) + Prisma drop + `db:reset`                                                                 | ⛔ blocked on S2                              | `10-4-recon.md` §SEED + §sequence; D-D4-REVERSAL                          |
| ph.5     | Scoring/execution layer                                                                                                          | ⬜ OUT of scope (separate initiative)         | —                                                                         |

## Next action

**Launch S2** — productionize the 10.1 compose-write prototype (UI-first `/feature`). At kickoff: ratify **D-10.4-3** (S2 scope; leaning already recorded = full four-projection, parallel/superset sequenced-last). S2 **must** discharge the **DR-1** carry-forward as part of its work: widen the read shape (`schemaSchema.{kind,archetypeId,archetypeParams}` → nullable), null-guard the ~6 platform read consumers, and **enable the composition-only create path in the handler** (S1 leaves it reachable-but-poison by design). Gate: coach re-walkthrough. 1 gated DB run.

## Open decisions awaiting ratification

- **D-10.4-3** (S2 compose-write scope) — leaning recorded (full four-projection-faithful; parallel/superset sequenced LAST in S2); ratify firmly at S2 kickoff.
- (D-10.4-1 the arc + D-10.4-2 kind-drop direction are now **RATIFIED** — see `decisions.md`.)

## Live carry-forwards

- **DR-1** (HARD → S2): read-shape widen + null-guard ~6 platform consumers + enable composition-only handler, BEFORE/with the first composition-only writes.
- **QA-004** (→ S2 with parallel/superset), **QA-103** (Hook-3 TOCTOU — deferred), **REVIEW-004** (marshalNullableJson dup → S3), **QA-untilrec** (deferred — frozen contract), **QA-006** (→ S3).
- **QA-001 + QA-003 → CLOSED in S1.** See `deferred.md`.

## Gotchas a resuming session must know

- **S1 shipped a DELIBERATE migration-intermediate (D-10.4-S1-INT):** composition-only `Schema` creates are reachable via the API but **not readable** — they persist, then the week read 500s (read shape stays archetype-non-null, option b). Accepted by the owner (local non-prod; won't merge broken; "process not result"). **S2 closes it** (DR-1). Don't "fix" it in isolation — it's the planned S1→S2 seam.
- The richest 10.x reasoning lived in gitignored `.feature-dev/<ts>/`; the durable distillate is `decisions.md` + `deferred.md` + `10-4-recon.md`. Trust those.
- `implementation/` is SUPERSEDED history; AlternatingGroup facts migrated to `decisions.md` D-AG-FACTS.
- The FROZEN contract is `@repo/contracts/lms/composition` — reuse, never edit. (S1 edited `lms/schema` — NOT frozen.)
- The api-server suite (~10 min, `vitest run` serial) is a **GATED MANUAL** run — **pre-push does NOT run it** (cone only: dep:check + lint + check-types).
