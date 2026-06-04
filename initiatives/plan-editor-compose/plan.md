# plan-editor-compose — plan

Phased roadmap. Each code step ships via `/feature` (UI-first where it has UI); the mechanical sweep via an ultracode workflow. Budget ≤1 heavy pipeline per session → spans sessions. Live status board = `state.md`; decisions = `decisions.md`; carry-forwards = `deferred.md`.

| #    | Step                                                                                                                | Gate                                                                      | Status                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 10.0 | Algebra spec (`algebra-spec.md`)                                                                                    | review                                                                    | ✅ DONE (2026-06-02)                                                    |
| 10.1 | Compose constructor prototype on mocks — canvas + axis-inspector + leaf editors + **duplication**                   | coach-walkthrough: expressiveness + ergonomics                            | ✅ DONE — walkthrough PASSED (`feat/compose-prototype-10-1`)            |
| 10.2 | Contracts + schema freeze — axes replace `archetypeId`; ladder-split; `.strict()`; additive `Schema.composition`    | `db:reset` gated (additive nullable → schema frozen-and-green without it) | ✅ DONE — contract FROZEN (`feat/compose-contracts-10-2`)               |
| 10.3 | Backend + seed-as-compositions — mapper read + tree-validation + dual-write + derived label + 5 Gauntlet seed trees | seed = composition trees; api-server suite green                          | ✅ DONE — 811/811 (`feat/compose-backend-10-3`); QA-001 carried to 10.4 |
| 10.4 | **Destructive sweep + QA-001 write-guard** — the arc (S1→S2→S3) below                                               | per-sub-step (see below); D-10.4-1/2/3 + S2 RATIFIED                      | 🔵 IN PROGRESS — S1 + S2-R1 done (PR #241, #242); S2-R2 next            |
| ph.5 | Scoring/execution layer — make the `scoring` axis live + conditional scoring + parallel interleave                  | separate initiative                                                       | ⬜ OUT of scope                                                         |

## 10.4 — the arc (recon done; `10-4-recon.md`; forks open in `decisions.md`)

The destructive cut cannot complete until the only authoring path (picker + 18 forms) is replaced by a working compose-write UI (the 10.1 prototype is walkthrough-validated but does not persist). So 10.4 is a 3-phase arc, not a pure sweep.

| Sub   | Step                                                                                                                                                             | Vehicle                                   | Gate                                                                                     | Status                                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| S1    | QA-001 write-guard (400-sibling + 3 hooks) + QA-003 fold + nullable-archetype expand                                                                             | `/feature` full                           | gated DB run; the read-500 test flips to write-400                                       | ✅ DONE — 813/813; PR #241                                 |
| S2-R1 | Productionize prototype: DR-1 read-widen + converter + persistence cascade + drawer mount + simple-axes UX + EMOM/container affordance + QA-001 client feedback  | `/feature` full                           | **coach re-walkthrough** (validated UX survives the real backend + persisted round-trip) | ✅ DONE — round-trip green; re-walkthrough PASSED; PR #242 |
| S2-R2 | parallel/superset authoring + two-phase ref persist + QA-004 existence-check + property-based round-trip test                                                    | `/feature` full (worktree-parallel waves) | coach re-walkthrough of Gauntlet C/E                                                     | ⏳ next (sequenced-last per D-10.4-3)                      |
| S3    | Mechanical sweep: delete old authoring → render-flip → seed composition-native + gate-rewrite → contract/api-server archetype removal → Prisma drop + `db:reset` | **ultracode Workflow**                    | husky cone green per commit; gated full suite after `db:reset`                           | ⛔ blocked on S2-R2                                        |

Green-keeping: S1+S2 additive; S3 reverse-dependency order, tightly-coupled core as one squash (`[[husky-cross-package-squash]]`). 2 gated DB runs total (S1, S3). Detail in `10-4-recon.md` §sequence.

## Open design details (resolved per step — see `decisions.md`)

- ladder placement → D-LADDER (RATIFIED 10.2). interval → D-INTERVAL (RATIFIED). EMOM slot → D-EMOM-SLOT; EMOM row-as-minute UX → D-EMOM-UX (S2). container-vs-row → D-CONTAINER-VS-ROW. AlternatingGroup fold → D-ALTGROUP-FOLD. `trailingConnector` → dropped (folds into `arrangement:ordered` / presentation; no carry).
- All 10.4 forks RATIFIED: D-10.4-1 (arc), D-10.4-2 (drop `kind` direction → S3), D-10.4-3 (S2 scope: full four-projection, parallel/superset last), D-10.4-S1-RS (read-shape option b), D-10.4-S1-INT (poison-intermediate, now CLOSED by S2-R1), D-10.4-S2 (S2 Run-1 calls: cascade/converter/persistence/FK/philosophy).
