# plan-editor-compose — state (the board)

**Updated:** 2026-06-03

A scannable board, not prose. The narrative lives in `journal.md`; the "why" in `decisions.md`; carry-forwards in `deferred.md`. This file = where we are + the one next action. **Resume here** (the SessionStart hook force-loads it).

## Board

| #        | Step                                                                                                                | Status                                                | Pointer                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 10.0     | Algebra spec                                                                                                        | ✅ DONE                                               | `algebra-spec.md`                                                                                         |
| 10.1     | Compose prototype on mocks (canvas + axis-inspector + leaf editors + duplication)                                   | ✅ DONE — coach-walkthrough PASSED                    | journal 2026-06-02; PR `feat/compose-prototype-10-1`                                                      |
| 10.2     | Contracts + schema freeze (axis contract, ladder-split, `.strict()`, additive `Schema.composition`)                 | ✅ DONE — contract FROZEN                             | journal 2026-06-03; `feat/compose-contracts-10-2`; D-INTERVAL/LADDER/CADENCE/PERSIST/STRICT/ALTGROUP-FOLD |
| 10.3     | Backend + seed-as-compositions (mapper read + tree-validation + dual-write + derived label + 5 Gauntlet seed trees) | ✅ DONE — api-server 811/811 green                    | journal 2026-06-03; `feat/compose-backend-10-3`; D-DUALWRITE/LABEL/SEED/UNTILREC/SCORING-INERT            |
| **10.4** | **Destructive sweep + QA-001 write-guard** — the arc below                                                          | 🔵 PLANNING (recon done; blocked on 3 open decisions) | `10-4-recon.md`; D-10.4-1/2/3 (OPEN)                                                                      |
| ↳ S1     | QA-001 write-guard + QA-003 fold + nullable-archetype expand                                                        | ⏳ next (after D-10.4-1/2 ratified)                   | `deferred.md` QA-001/003; `10-4-recon.md` §WRITE-GUARD                                                    |
| ↳ S2     | Productionize the compose-write prototype (converter + persistence + type-align + mount + coach re-walkthrough)     | ⛔ blocked on S1 + D-10.4-3                           | `10-4-recon.md` MINE 2; D-EMOM-UX, D-CONTAINER-VS-ROW                                                     |
| ↳ S3     | Mechanical sweep (ultracode workflow) + Prisma drop + `db:reset`                                                    | ⛔ blocked on S2                                      | `10-4-recon.md` §SEED + §sequence; D-D4-REVERSAL                                                          |
| ph.5     | Scoring/execution layer                                                                                             | ⬜ OUT of scope (separate initiative)                 | —                                                                                                         |

## Next action

**Ratify the 3 open 10.4 decisions** (`decisions.md` D-10.4-1/2/3) — they gate execution and were surfaced for the user, not yet signed off:

- **D-10.4-1** — the arc S1→S2→S3 (vs UI-as-separate-initiative, vs placeholder-archetype sweep). Rec: the arc.
- **D-10.4-2** — drop `Schema.kind` + abolish the kind-based write guards (behavior change). Rec: drop.
- **D-10.4-3** — S2 compose-write UI scope (full four-projection vs MVP, parallel/superset day-1 or increment). Coach-POV call. Rec: full, parallel/superset sequenced last-within-S2.

Once ratified → launch **S1** via `/feature small` (api-server: write-guard + QA-003 + nullable expand). 1 gated DB run.

## Open decisions awaiting ratification

D-10.4-1 (arc), D-10.4-2 (kind drop), D-10.4-3 (S2 scope) — see `decisions.md`.

## Live carry-forwards

QA-001 (HARD BLOCKER → S1), QA-003 (→ S1), QA-004 (→ S2 with parallel/superset), QA-002 (deferred), QA-untilrec (deferred — frozen contract) — see `deferred.md`.

## Gotchas a resuming session must know

- The richest 10.x reasoning was in gitignored `.feature-dev/<ts>/` + a web-Claude chat; the durable distillate is now `decisions.md` + `deferred.md` + `10-4-recon.md`. Trust those, not a re-derivation.
- `implementation/` is SUPERSEDED history (pre-pivot); its still-live AlternatingGroup facts are migrated to `decisions.md` D-AG-FACTS. Don't plan off `implementation/`.
- The FROZEN contract is `@repo/contracts/lms/composition` — reuse, never edit (a genuine need = a Gate-A escalation).
