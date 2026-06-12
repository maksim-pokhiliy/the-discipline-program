# session-primitive — plan

Wave-structured per **D-8 JIT-FREEZE**: runner sessions run only on RATIFIED/ACCEPTED grid rows; OPEN items close just-in-time before the wave that needs them. Budget: ≤1 full `/feature` (or 2 small) per runner session (D-7). UI-first house rule: the box UX ships on mocks (W1) before the model lands under it (W2).

| #   | Wave                                                                                                   | Needs decided first        | Gate                                                               | Status              |
| --- | ------------------------------------------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------ | ------------------- |
| 0   | Founding: review → skeleton + grid + spec                                                              | —                          | owner ГО                                                           | 🟢 done             |
| W1  | Group/box UX on the existing model (platform-only)                                                     | nothing open               | coach walkthrough (boxes feel right) + platform suite green        | 🟢 merged (PR #261) |
| W2  | Model core: Group entity, recursion death, arrangement death, ratified leaf kills, seed, guards        | **D-MARKER-DEATH**         | gated api-server suite + reseed + round-trips                      | 🟢 merged (PR #262) |
| W3  | Editor remap onto the Group model (proto fidelity, gesture set, draft collapse)                        | — (rides W2)               | round-trips + walkthrough of the full gesture set                  | 🟢 merged (PR #263) |
| W4  | Row grammar + leaf residuals (plaque/rest/OR/superset carriers; position/tempo/weight/header/slot/cap) | **F-PLAQUE + leaf F-rows** | walkthrough + suites; `primitive-spec.md` has zero OPEN rows after | ⚪                  |

## W1 — Group/box UX on the existing model (launched 2026-06-10)

Platform-only; ZERO contract/api-server/Prisma/seed changes. ADR-0040 stays the live law — W1 re-skins its render and adds an explicit creation affordance; the Group entity is W2's job.

Deliverables: (1) a structurally-parallel parent (live `isStructurallyParallel` predicate — the ONE-predicate rule) renders as a BOX: frame/rail enclosing member cards as one unit + label zone + the add-sub-schema affordance relocated into the box; non-parallel parents (EMOM cadence) keep the list render. (2) Box label = parent `Schema.header`, displayed + edited in place through the existing update path; empty → neutral placeholder. (3) The ladder batch flow gets an explicit «связать в коробку» checkbox (default checked; unchecked → N independent flat ladders, no box) — D-2's de-bear-ification of auto-link. OUT: DnD-grouping/ungroup/member-removal persistence (need re-parenting API → W2/W3), in-modal preview (owner: "это уже потом").

Prompt issued 2026-06-10; runner session via `/feature` full; orchestrator reviews the git diff before W2 launches.

## W2 — model core

Group persisted (entity + membership), `parentSchemaId` dies, arrangement axis dies (`interleaveOrder` → Group display setting), ratified leaf kills (STANDALONE_URL/LOAD, REP_DEFINITION + `compoundRep`, cyclical+sandwich → compound, footnote markers, reps/load slim incl. `byProfile`), seed re-expression (4 parallels + block-010 + EMOM slots-as-rows), guards re-derived. Marker cut rides here if D-MARKER-DEATH = yes. Aggressive, bridge-free, `db:reset` world.

## W3 — editor remap (MERGED 2026-06-12 — PR #263 → main `9a9dfb8e`; 12 build commits + 6 post-review walkthrough-fix commits; DR-W3-1..12)

The editor caught up to the Group model with the owner's hi-fi prototype (`plan-editor-hi-fi-v-2`) as the UX law: the LIVE idempotency-key 400 on the unchecked batch died (separator `:`→`-`, format-pin test against the real regex — DR-W3-1); the group card rebuilt PLATFORM-LOCAL to the proto (solid tinted frame, GROUP overline, accent rail, track-no badges, `.seg` interleave — DR-W3-2/3, zero hex); the gesture set (Add group / Add track / Ungroup / Delete-with-tracks, label/interleave round-trip) wired onto the EXISTING W2 API — zero new endpoints, platform wave (DR-W3-4/5/6); the recursive authoring draft layer collapsed to flat `SchemaDraft`/`GroupDraft` (W2-DRAFT-RECURSION — DR-W3-7, `arrangement-tree.ts` deleted); QA-004 kind-switch confirm (DR-W3-8, keep-confirm-always per QA-114) + W2-STALE-\* hygiene (DR-W3-10) rode along. A post-QA CRITICAL (QA-104 double-fire) was caught + fixed with a synchronous re-entry guard on all new gestures (DR-W3-REENTRY). Cross-boundary DnD-grouping stayed OUT (proto uses buttons; the standing cross-scope-drag deferral holds). NOT a new one-way door — editor onto the existing ADR-0041, no new ADR. The single api-server touch was a cosmetic seed const rename (owner-delegated, byte-identical data — DR-W3-FORK-3) → no gated-suite ritual required. **Pending: orchestrator git-diff review → §10 owner walkthrough → merge.**

## W4 — row grammar + leaf residuals

Plaque/row-group boundary per F-PLAQUE; rest/OR/superset carriers; position library (F-POSITION-CARRIER), tempo (F-TEMPO), weight exotics (F-WEIGHT-EXOTICS), header (F-HEADER), slot (F-SLOT), Block.timeCap (F-BLOCK-TIMECAP). After W4 the spec has zero OPEN rows.

## Design follow-ups (owner-paced, between waves)

Order: **D-MARKER-DEATH** (yes/no — needed before W2) → **F-PLAQUE** (gates W4; one focused discussion, orchestrator brings a concrete rec) → F-POSITION-CARRIER + F-CHIPS → F-WEIGHT-EXOTICS + F-TEMPO (consult `load-representation.md` + `load-edge-cases.md`) → F-HEADER + F-BLOCK-TIMECAP + F-SLOT.

## Runner-prompt checklist (D-7 — how to brief a wave)

Every runner prompt is SELF-CONTAINED (the runner session has no chat context; the SessionStart hook loads only `state.md`). It must carry:

1. **Context block** — initiative pointer, read-first list (charter / decisions / primitive-spec §§ / plan §wave), which D/DR rules bind, and what the LIVE law of main is (vs. what this wave changes).
2. **Deliverables**, numbered, each with the concrete surface (files/components) named where known — and corrections welcome (W1's prompt mis-located the submit fork; the runner's verify pass caught it, that's the design stage's job).
3. **Hard red lines** — what must NOT change, incl. why (e.g. one-predicate rule + the CRITICAL it prevents; OPEN decisions whose surface is untouchable).
4. **Verify-then-spec items** the design stage must confirm in code before locking.
5. **Acceptance = the owner's literal walkthrough script**, numbered.
6. **Exact verify commands:** root `pnpm check-types && pnpm lint`; platform tests ONLY via `SKIP_ENV_VALIDATION=1 pnpm exec vitest run --project platform` (`pnpm --filter platform test` silently no-ops — false green); NEVER the root `pnpm test` or any api-server suite (gated, owner-only manual run). A wave touching api-server states its gate as the OWNER's manual ritual (db:reset + seed + gated suite).
7. **Process block** — branch name, conventional lowercase commits, no AI trailers, never `--no-verify`, full `/feature` pipeline with real forks surfaced at Gate A, close-out docs promoted into the initiative IN THE SAME PR, single `/feature` run per session (house budget).
