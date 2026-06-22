# coach-station — state (the board)

**Updated:** 2026-06-17 (**⏸ PAUSED — ACTIVE has since moved on (primitive-v2 → athlete-core → profile-axis-catalog).** The timed-test found 8 primitive expressiveness gaps (basket B); Phase 1 must complete before Phase 2 can formally close. Resume coach-station after primitive-v2: the Phase 2 Exit timed-test + the owner-owed gated suites. _Prior status:_ **Phase 2 substantively COMPLETE — all waves merged to `main @ 93fda374`.** Clone (R1) + profile (P) + authoring inline-create (A-known) all shipped; the `/coach` dashboard + athletes redesigns shipped as redesign-propagation waves; G (DnD group-creation) DROPPED (D-11); equipment + `movementFamily` cut (D-9 / D-10). Only R2/templates parked. **NEXT: the roadmap Phase 2 Exit — owner programs a full multi-week cycle, timed, beats Excel** (also closes the still-open Phase 1 e2e self-test). Then Phase 3 (athlete core). Several OWNER-OWED gates outstanding — see below.)

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`.

## Board

| #   | Step                                              | Status                                   | Pointer                                                  |
| --- | ------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| 1   | R1 — Clone (engine R1a + editor-UX R1b)           | 🟢 MERGED (PR #270 + #274)               | D-3 / D-4 / D-6 / D-8 · `r1-clone-design.md`             |
| 2   | P — Coach profile UI                              | 🟢 MERGED (PR #273; polish #275)         | D-7 PROFILE-SCHEMA-EXTENDED                              |
| 3   | A-known — Authoring inline-create (labels + exer) | 🟢 MERGED (PR #277)                      | D-10 INLINE-CREATE+DROP-MOVEMENT-FAMILY                  |
| 4   | G — DnD group-creation                            | ⬛ DROPPED (D-11)                        | → `docs/roadmap.md` v1.1 OUT · deferred DND-GROUP-CREATE |
| —   | Dashboard redesign (Triage Stack + real data)     | 🟢 MERGED (PR #279)                      | `coach-dashboard-redesign.md`                            |
| —   | Athletes redesign (roster + detail drawer)        | 🟢 MERGED (PR #278) ⚠ no durable record | deferred → ATHLETES DURABLE-RECORD GAP                   |
| —   | R2 — Templates/archetypes                         | 🅿️ parked                                | D-2 · deferred → TEMPLATES                               |
| —   | A-e2e — Authoring polish (e2e-fed)                | 🟠 open                                  | deferred → A-E2E-POLISH (holds QA-D-03, P-6)             |

Scope cuts this phase: **equipment** (D-9) + **movementFamily** (D-10) removed from the exercise catalog; **G** (D-11) dropped.

## Next action

**▶ Phase 2 Exit (roadmap gate) — owner programs a full multi-week cycle in the editor, TIMED, and confirms it beats the Excel baseline.** This is the gate that lets Phase 2 be declared DONE (the bar's "programmed a cycle faster than Excel"), and the same hands-on session closes the still-open **Phase 1 e2e self-test** (build the evil A–E fixtures by hand, zero model gap). With clone + inline-create + dashboard all live, the authoring loop is whole — the only missing signal is the stopwatch. After it passes → **Phase 3 (athlete core)**: redesign `Performed*` / `OneRMRecord` / scoring FROM SCRATCH against the frozen primitive — its own mini design-cycle (new initiative) before contracts.

## Open decisions awaiting ratification

NONE — D-1..D-11 RATIFIED. (R2 slot parked, not blocking.)

## Live carry-forwards (owner-owed gates are the headline — don't lose them)

- **OWNER-OWED gated api-server suites — written-not-run across waves** (R1A / P / A-known / dashboard `*-GATED-ACCEPTANCE`): one ritual covers them — `pnpm db:reset && pnpm --filter @repo/api-server test` (~10 min serial, live Neon). `db:reset` also applies the schema drops (equipment tables + `training_exercises.movementFamily` column).
- **`BLOB_READ_WRITE_TOKEN`** in `apps/platform/.env.local` — required for coach avatar upload (wave P).
- **ATHLETES DURABLE-RECORD GAP** — PR #278 shipped without a durable record / carry-forwards; needs the #278 session's hand-off (see `deferred.md`).
- Accepted/INFO (no action): R1a QA-005-CLONE · CLONE-002 (documented) · R1b QA-001-week / QA-002 / QA-009/010 (race-only) · P QA-006-CRED-ROW / QA-007-TZ-NUDGE · dashboard PERF-001 / QA-METRICS-2 (owner domain call) / HEALTH-CHIP-FROM-MESSAGE · A-known QA-002-CROSS-LEVEL (R-3) / LABEL-MULTI-UX-RATIFY (awaiting walkthrough). · TEMPLATES (parked). See `deferred.md`.

## Gotchas a resuming session must know

- **Phase 2 is functionally whole, but NOT formally accepted** — the timed-cycle Exit + the gated suites are owner-owed. Don't start Phase 3 build before the owner runs the timed-test (it may surface authoring papercuts that re-open A-e2e).
- **The exercise catalog lost equipment + movementFamily** (D-9 / D-10). Exercise survivor fields: `canonicalName · nature · defaultDemoUrls · aliases · notes`. Don't reintroduce either.
- **New shared primitives in `@repo/ui`** (D-10): `CreatablePicker` (single/multi, 5 call sites) + `ExerciseFormFields` (admin + platform modal) + `usePromiseModal`; dashboard added a shared `coach-metrics` engine + 9 primitives — these are the foundation for the wider apps/platform redesign.
- **The frozen session primitive + the deep-clone engine stay Sacred** — every wave reused, none edited (`SCHEMA_BODY_INCLUDE`, mappers, `verify*Ownership`, contiguity asserts).
- **G is gone, not parked** (D-11) — if group-creation-by-drag ever resurfaces it's a post-launch v1.1 item; the shipped select-mode group-create already covers the capability.
- **P-6 (reps-unit)** stays a session-primitive freeze call — clone/inline-create copy whatever leaf shape exists, insulated.

=== Resume: charter -> state -> decisions(OPEN — none) -> deferred(OPEN) -> plan. Close-out done 2026-06-16. ===
