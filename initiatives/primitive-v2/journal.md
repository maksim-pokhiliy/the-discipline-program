# primitive-v2 — journal

Append-only. One entry per session/step.

## 2026-06-17 — founded (orchestrator session)

- **Context.** The coach-station timed-test (the Phase-2-Exit attempt = the Phase-1 e2e self-test) had the owner hand-build the evil corpus in the live editor. It surfaced 20 findings (`session-primitive/e2e-findings.md`): basket A (9 UI papercuts) shipped via PR #281; basket C (2) deferred; **basket B (8 expressiveness gaps)** is this initiative.
- **Founding analysis (orchestrator, against the FROZEN `primitive-spec.md` + `decisions.md`).** Mapped each basket-B gap:
  - **RE-OPENS of deliberate Phase-1 kills:** #3 row-intensity + #16 block-intensity (both killed by `D-FLOORS`, intensity-schema-only); #3 row-rest (killed by `D-PLAQUE`, ONE-rest-per-schema).
  - **SACRED-TOUCH:** #4 cap-on-any-schema — the 6 repetition kinds are charter-sacred; `timeCap` is one kind, so a ladder can't be capped. The question is cap PLACEMENT (cross-cutting attribute vs kind), not adding a 7th kind. Owner-gated.
  - **EXTENSIONS:** #6 sub-minute intervals (Tabata :20/:10 vs integer `workMin`); #17 nested profiles (flat `byProfile` → axis×axis).
  - **MOSTLY EXISTS:** #12 row duration — `reps.unit (sec|min|km)` already in the spec (P-6); only Zone 2 = row-intensity is missing (folds into #3).
  - **EXECUTOR-GATED:** #11 score/effort-window + #20 inter-schema rest — both ≈ `D-EXEC-DEFER` (scoring/transition → Phase-4 executor). Default DEFER; owner decides in/out at step 0.
- **Charter framing.** primitive-v2 = completing Phase 1, not re-litigating it. Re-opens are legitimate because the kills were corpus-floor calls and the timed-test is harder evidence; each re-open needs a NEW superseding decision with the timed-test rationale. The channels rule (D-5) + structure-not-graph (D-2/D-4) + catalog natures stay sacred.
- **Scaffolded** `initiatives/primitive-v2/` (charter/plan/state/decisions/deferred/journal) + `planner-prompt.md`; flipped `initiatives/ACTIVE` → `primitive-v2` (coach-station PAUSED, not closed — its board notes the pause + the owner-owed Phase-2 gates).
- **Next.** Owner runs the planner session with `planner-prompt.md` (clean context) → design lock (step 0) → per-floor `/feature` waves.

## 2026-06-17 — design locked (planner session)

- **Read + verified.** Charter, frozen `primitive-spec.md`, `e2e-findings.md` (basket B), `e2e-evil-corpus.md`, the re-opened decisions (D-FLOORS / D-PLAQUE / D-EXEC-DEFER / D-LOAD-FINAL / D-5 / D-2-4), roadmap Phase 1, planner-discipline. Then verify-then-spec verbatim against live contracts / Prisma / api-server mappers+handlers / client query layer / platform editor (read + write) — five parallel reader passes; the full consumer map is in `reshape-design.md`.
- **Research moved scope (in our favour).** (1) **P-6 already closed** — `REP_UNITS` already has `m`+`cal`; #12 collapsed to its Zone-2 = row-intensity remnant → folds into #3. (2) **Intensity re-open = restoring the spec's OWN Grid B intent** — Grid B already said "scopes block/schema/row + render overlay"; D-FLOORS over-corrected to schema-only the same day (the spec self-contradicts). (3) **#4 owner-directed** in GAP-1 (cap = orthogonal composition axis), not open. (4) **#13 + C-19 already express** (compound / per-set row-group). (5) **Only 3 new Prisma columns** — cap/interval ride inside `composition` Json, byProfile inside `load` Json; the three editors (`IntensityFields`/`RestSpecFields`/`TimeCapFields`) already exist.
- **Escalated 5 sensitive calls as prose + strong recs** (not a menu — [[decisive-execution-over-gating]]); re-told conversationally on owner request (real-workout framing, no finding-numbers). **Owner ratified all ("ОК х5")** + directed **ONE wave, no floor-split**.
- **Output.** `reshape-design.md` (the design contract — per-change shapes + full touch-map + evil-corpus re-expression + spec re-freeze checklist); `decisions.md` seeded with 7 ratified D-V2-\* (each re-open SUPERSEDES its session-primitive original with the timed-test rationale); board → step 1; `plan.md` → one wave; `reshape-feature-prompt.md` (the self-contained `/feature` full prompt).
- **Next.** Owner runs `/feature` (full) with `reshape-feature-prompt.md`. Orchestrator reviews via `git diff` (D-7); owner browser-walkthrough + gated api-server suite = acceptance; close-out IN the feature PR.
