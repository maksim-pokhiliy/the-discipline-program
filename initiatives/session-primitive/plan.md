# session-primitive — plan

Wave-structured per **D-8 JIT-FREEZE**: runner sessions run only on RATIFIED/ACCEPTED grid rows; OPEN items close just-in-time before the wave that needs them. Budget: ≤1 full `/feature` (or 2 small) per runner session (D-7). UI-first house rule: the box UX ships on mocks (W1) before the model lands under it (W2).

| #   | Wave                                                                                                   | Needs decided first        | Gate                                                               | Status                 |
| --- | ------------------------------------------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------ | ---------------------- |
| 0   | Founding: review → skeleton + grid + spec                                                              | —                          | owner ГО                                                           | 🟢 done                |
| W1  | Group/box UX on the existing model (platform-only)                                                     | nothing open               | coach walkthrough (boxes feel right) + platform suite green        | 🔵 launched 2026-06-10 |
| W2  | Model core: Group entity, recursion death, arrangement death, ratified leaf kills, seed, guards        | **D-MARKER-DEATH**         | gated api-server suite + reseed + round-trips                      | ⚪                     |
| W3  | Editor remap onto the Group model (DnD-grouping, ungroup, member add/remove — real persistence)        | — (rides W2)               | round-trips + walkthrough of the full gesture set                  | ⚪                     |
| W4  | Row grammar + leaf residuals (plaque/rest/OR/superset carriers; position/tempo/weight/header/slot/cap) | **F-PLAQUE + leaf F-rows** | walkthrough + suites; `primitive-spec.md` has zero OPEN rows after | ⚪                     |

## W1 — Group/box UX on the existing model (launched 2026-06-10)

Platform-only; ZERO contract/api-server/Prisma/seed changes. ADR-0040 stays the live law — W1 re-skins its render and adds an explicit creation affordance; the Group entity is W2's job.

Deliverables: (1) a structurally-parallel parent (live `isStructurallyParallel` predicate — the ONE-predicate rule) renders as a BOX: frame/rail enclosing member cards as one unit + label zone + the add-sub-schema affordance relocated into the box; non-parallel parents (EMOM cadence) keep the list render. (2) Box label = parent `Schema.header`, displayed + edited in place through the existing update path; empty → neutral placeholder. (3) The ladder batch flow gets an explicit «связать в коробку» checkbox (default checked; unchecked → N independent flat ladders, no box) — D-2's de-bear-ification of auto-link. OUT: DnD-grouping/ungroup/member-removal persistence (need re-parenting API → W2/W3), in-modal preview (owner: "это уже потом").

Prompt issued 2026-06-10; runner session via `/feature` full; orchestrator reviews the git diff before W2 launches.

## W2 — model core

Group persisted (entity + membership), `parentSchemaId` dies, arrangement axis dies (`interleaveOrder` → Group display setting), ratified leaf kills (STANDALONE_URL/LOAD, REP_DEFINITION + `compoundRep`, cyclical+sandwich → compound, footnote markers, reps/load slim incl. `byProfile`), seed re-expression (4 parallels + block-010 + EMOM slots-as-rows), guards re-derived. Marker cut rides here if D-MARKER-DEATH = yes. Aggressive, bridge-free, `db:reset` world.

## W3 — editor remap

The editor reads/writes Groups natively; DnD-grouping, one-click ungroup, member add/remove get real persistence; the draft↔contract mapper layer collapses.

## W4 — row grammar + leaf residuals

Plaque/row-group boundary per F-PLAQUE; rest/OR/superset carriers; position library (F-POSITION-CARRIER), tempo (F-TEMPO), weight exotics (F-WEIGHT-EXOTICS), header (F-HEADER), slot (F-SLOT), Block.timeCap (F-BLOCK-TIMECAP). After W4 the spec has zero OPEN rows.

## Design follow-ups (owner-paced, between waves)

Order: **D-MARKER-DEATH** (yes/no — needed before W2) → **F-PLAQUE** (gates W4; one focused discussion, orchestrator brings a concrete rec) → F-POSITION-CARRIER + F-CHIPS → F-WEIGHT-EXOTICS + F-TEMPO (consult `load-representation.md` + `load-edge-cases.md`) → F-HEADER + F-BLOCK-TIMECAP + F-SLOT.
