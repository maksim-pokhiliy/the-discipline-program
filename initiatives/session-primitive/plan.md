# session-primitive — plan

Rough phasing; refined at spec freeze. Budget: ≤1 full `/feature` (or 2 small) per runner session (D-7). UI-first house rule applies to the implementation steps: the group/box UX ships on mocks before the contract reshape lands under it.

| #   | Step                                                                       | Gate                                                                                       | Status     |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------- |
| 0   | Founding: review → skeleton + grid + spec                                  | owner ГО (received 2026-06-10)                                                             | 🟢 done    |
| 1   | Follow-up design: close F-\* + D-MARKER-DEATH → freeze `primitive-spec.md` | owner ratifies every grid row (no OPEN rows left)                                          | ⚪ next    |
| 2   | Group/box UX on mocks (+ plaque if ratified)                               | coach walkthrough: build parallel ladders, an OR-pair, a superset via boxes; feel approved | ⚪ pending |
| 3   | Contracts + Prisma + seed reshape                                          | recursion dead; Group persisted; leaf slimmed per grid; gated api-server suite + reseed    | ⚪ pending |
| 4   | Editor remap + cleanup waves                                               | round-trips green; corpus expressibility spot-checks; no dead mapper layers left           | ⚪ pending |

## Step 1 — design follow-ups (owner-paced, no runner sessions needed)

The F-ledger in `deferred.md` + D-MARKER-DEATH. Owner is design-fatigued ("я устал дизайнить") — batch these into short focused discussions, one topic at a time, orchestrator brings a concrete recommendation to each. Suggested order (dependency-driven):

1. **F-PLAQUE** first — it decides the row-level grammar (rest rows, OR carrier, connectors, instruction strips) and feeds F-CHIPS/F-SLOT.
2. **D-MARKER-DEATH** (one yes/no with the Block C re-expression shown).
3. **F-POSITION-CARRIER + F-CHIPS** together (library vs plaque vs notes — one carrier conversation).
4. **F-WEIGHT-EXOTICS + F-TEMPO** together (the "what stays typed on the row" conversation; consult `load-representation.md` + `load-edge-cases.md`).
5. **F-HEADER + F-BLOCK-TIMECAP + F-SLOT** (small residuals).

Output: `primitive-spec.md` with zero OPEN rows → freeze.

## Steps 2–4 — implementation (runner sessions via `/feature`)

Sequenced after freeze; expected shape (refine then):

- **Step 2 (UI-first).** Box rendering (rail/frame + label), DnD-grouping gesture, batch-create checkbox, ungroup affordance — on mock/draft state; the existing flows must not hard-regress. Gate = coach walkthrough.
- **Step 3 (model).** Prisma: Group table(s), `parentSchemaId` removal, leaf column slim-down; contracts: grid verdicts; seed re-authoring (corpus blocks re-expressed); api-server guards re-derived; aggressive, bridge-free, `db:reset` world. Gate = gated suite + reseed + coverage gate re-pinned.
- **Step 4 (remap).** Editor reads/writes the new shape; the mapper layer (`schema-to-draft-container`, `build-axis-composition`, arrangement machinery) collapses; cleanup of dead surfaces. Gate = round-trips + spot-check authoring of grid's hardest rows (drop-set as stages-rows, asymmetric L/R pairs, depth-3 corpus block).

Each step = its own runner session with a self-contained prompt written by the orchestrator; review via git diff before the next step launches.
