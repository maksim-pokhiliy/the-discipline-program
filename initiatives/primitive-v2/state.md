# primitive-v2 — state (the board)

**Updated:** 2026-06-17 (**design locked**). Step 0 done — owner ratified all 5 calls ("ОК х5") + directed ONE wave (no floor-split). Design in `reshape-design.md`, decisions seeded (`decisions.md` D-V2-\*). **NEXT: run the reshape as ONE `/feature` (full)** with `reshape-feature-prompt.md`.

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`. **Resume here** (the SessionStart hook force-loads it).

## Board

| #   | Step                                 | Status      | Pointer                                                  |
| --- | ------------------------------------ | ----------- | -------------------------------------------------------- |
| 0   | Design lock (planner)                | ✅ DONE     | `reshape-design.md` · `decisions.md` (7 D-V2-\*)         |
| 1   | Reshape — ONE `/feature` (full)      | ⬜ NEXT     | `reshape-feature-prompt.md` · 5 changes + spec re-freeze |
| —   | Executor-gated (#11 score, #20 rest) | 🅿️ deferred | D-V2-EXEC-DEFER-HOLD · Phase-4                           |

## Next action

**▶ Owner runs `/feature` (full)** with `reshape-feature-prompt.md`. The wave: contracts → Prisma (3 new columns) → mappers → api-server guards → platform editor (read + write) → `primitive-spec.md` re-freeze, all in one. Orchestrator reviews via `git diff` (D-7); owner browser-walkthrough + the gated api-server suite are acceptance. Close-out docs land IN the feature PR.

## Open decisions awaiting ratification

NONE — all 7 ratified this session (owner "ОК х5" + one-wave): D-V2-INTENSITY-TRINITY · D-V2-ROW-REST · D-V2-CAP-AXIS · D-V2-INTERVAL-UNIT · D-V2-PROFILE-NESTING · D-V2-EXEC-DEFER-HOLD · D-V2-ONE-WAVE. See `decisions.md`.

## Live carry-forwards

Basket C (deferred): #2 (build-to-1RM → Phase 3), #19 (per-round rotation — already expresses via per-set row-group, no fold). Executor-gated: #11 (score), #20 (inter-schema rest) → Phase-4 (D-V2-EXEC-DEFER-HOLD). All in `deferred.md`.

## Gotchas a resuming session must know

- **Only 3 Prisma columns** are new (`SchemaRow.intensity`, `SchemaRow.rest`, `Block.intensity`). Cap + interval ride inside `Schema.composition` Json; byProfile inside `SchemaRow.load` Json — no columns, no mapper change for those three (`compositionSchema.parse` / `loadSchema.parse` pick them up).
- **Three editors already exist + are reused** — `IntensityFields`, `RestSpecFields`, `TimeCapFields`. The reshape wires them into new places, not new UI from scratch. NEW UX: a block-intensity edit surface + the byProfile axes/cells grid (→ ui-ux-pro-max).
- **P-6 was already closed** (`REP_UNITS` already has `m`+`cal`); #12 collapsed into #3 (Zone-2 = row intensity). #13 + C-19 already express. Verified at design time — don't re-discover.
- **Intensity re-open restores the spec's OWN Grid B intent** (it already said scoped block/schema/row + render overlay); D-FLOORS over-corrected to schema-only the same day. The overlay is render-time, dimension-wise, row > schema > block.
- **api-server suite = OWNER's gated manual run** (~10 min serial) — executor writes the tests, owner runs them. Don't auto-run it.
- The baseline is `session-primitive/primitive-spec.md` (FROZEN until this wave re-freezes it).
- **coach-station is PAUSED, not closed** (Phase 2 Exit + owner-owed gated suites pending); ACTIVE moved here because Phase 1 must complete before Phase 2 can formally close.

=== Resume: charter -> state -> decisions(all RATIFIED) -> deferred(OPEN) -> reshape-design.md -> reshape-feature-prompt.md. Close-out: run /initiative-close (promote, update board+journal+plan, one docs commit IN the feature PR). ===
