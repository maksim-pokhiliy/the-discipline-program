# primitive-v2 — state (the board)

**Updated:** 2026-06-17 (**founded**). Phase-1 re-open: the coach-station timed-test surfaced 8 expressiveness gaps (basket B of `session-primitive/e2e-findings.md`). **NEXT: a planner session designs the reshape with a clean context** (`planner-prompt.md`).

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`. **Resume here** (the SessionStart hook force-loads it).

## Board

| #   | Step                                 | Status      | Pointer                                     |
| --- | ------------------------------------ | ----------- | ------------------------------------------- |
| 0   | Design lock (planner)                | ⬜ NEXT     | `planner-prompt.md` · e2e-findings basket B |
| 1   | Row axes (rest + intensity)          | ⬜ pending  | #3, #12 · re-open D-FLOORS row + ONE-REST   |
| 2   | Block axis (effort)                  | ⬜ pending  | #16 · re-open D-FLOORS block                |
| 3   | Schema cap (any schema)              | ⬜ pending  | #4 · **SACRED-TOUCH** owner-gated           |
| 4   | Cross-cutting (intervals, profiles)  | ⬜ pending  | #6, #17 · typed extensions                  |
| —   | Executor-gated (#11 score, #20 rest) | 🅿️ deferred | D-EXEC-DEFER · owner decides at step 0      |

## Next action

**▶ Run the planner session** with `planner-prompt.md` (clean context). It reads the FROZEN spec + e2e-findings + the decisions being re-opened, maps each gap, and **locks scope + the sacred-touch (#4) + the D-FLOORS re-opens (#3/#16) WITH the owner before any `/feature`.** Output: a design doc + seeded `decisions.md`, then the per-floor `/feature` waves.

## Open decisions awaiting ratification

NONE seeded yet — the planner session seeds them. The re-opens (D-FLOORS intensity, ONE-rest-per-schema) + the #4 cap-placement call need owner ratification at step 0 before any code.

## Live carry-forwards

Basket C (deferred): #2 (build-to-1RM → Phase 3), #19 (per-round rotation). Executor-gated: #11 (score), #20 (inter-schema rest). All recorded in `session-primitive/e2e-findings.md`. See `deferred.md`.

## Gotchas a resuming session must know

- **This RE-OPENS frozen decisions** — `D-FLOORS` (intensity schema-only), ONE-rest-per-schema (`D-PLAQUE`). Re-opening is legitimate (timed-test = new, harder evidence) but each needs a NEW superseding decision with rationale, NOT a silent re-addition.
- **#4 touches sacred** — the 6 repetition kinds. It does NOT add a kind; it asks if `timeCap` should also be an optional cross-cutting cap. Owner-gated.
- **The channels rule (D-5) governs** every new field — typed only if machine-read; else human text. No inert surface (the same discipline that killed the inert `window` field via ADR-0039).
- **`reps.unit (sec|min|km)` ALREADY exists** — #12 (Row 2:00) is mostly covered; the real gap is row-intensity (#3).
- The baseline is `session-primitive/primitive-spec.md` (FROZEN) — read it before designing; do not re-derive the model from code.
- **coach-station is PAUSED, not closed** (Phase 2 Exit + owner-owed gated suites pending); ACTIVE moved here because Phase 1 must complete before Phase 2 can formally close.

=== Resume: charter -> state -> decisions(OPEN) -> deferred(OPEN) -> plan -> planner-prompt.md. ===
