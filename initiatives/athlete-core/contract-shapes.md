# athlete-core — contract-shape spec (block 1: data core)

**Status: forks resolved 2026-06-17 (all resolved; block-1 SHIPPED).** Shapes specced VERBATIM against current code (sources §0). With the forks ratified (`decisions.md` D-BENCHMARK-MARKER / D-LOGGING-MINIMAL / D-LOAD-RESOLVE / D-PUBLISH-MODEL), the Performed\* shape (§3) is locked; the byProfile-cell pick is resolved (D-PROFILE-SELECTIONS). The executor reads THIS + the entity pattern (`plan-enrollment`) + the verbatim source — it does not re-derive.

## 0. Sources verified verbatim (on hand)

- 6 repetition kinds + cross-cutting `cap` — `composition/composition.schema.ts`.
- Leaf VOs: `intensity.ts` (5 dims), `reps.ts` (REP_UNITS + repNotation), `cap-spec.ts` (restSpec), `time-cap.ts`, `load.ts` (4 kinds incl. final byProfile axes/cells + percentage self/other).
- Entity pattern: `plan-enrollment` (schema/create + api.schema + constants + types + barrels) + the lms entities barrel.
- Wiring: Prisma → `mapToX` mapper (+ enum maps) → `lmsXApi` handler → Next route via `createAuth*Handler` + `withAthleteAuth`/`withCoachAuth`.
- Current Prisma: `PerformedSession` (`@@unique([sessionId,userId])`), `PerformedExerciseInstance` (Json actuals), `OneRMRecord` (`@@unique([userId,exerciseId])`, source enum). NO contracts for any — greenfield. Athlete surface: only `/athlete` + `/athlete/profile` + `api/platform/athlete/profile`; everything else greenfield. `withAthleteAuth` exists.

## 1. Shapes

### 1.1 Result types — `result.ts` — D-RESULT-TYPES

```
RESULT_TYPES = ["time","rounds_reps","load","max_reps","distance","calories"] as const
DISTANCE_UNITS = ["m","km"] as const   // (micro: reuse NUMERIC_PACE_DISTANCE_UNITS? — confirm at build)

resultSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("time"),        seconds: z.number().positive() }),
  z.object({ type: z.literal("rounds_reps"), rounds: z.number().int().nonnegative(), reps: z.number().int().nonnegative() }),
  z.object({ type: z.literal("load"),        kg: z.number().positive() }),
  z.object({ type: z.literal("max_reps"),    reps: z.number().int().positive() }),
  z.object({ type: z.literal("distance"),    value: z.number().positive(), unit: z.enum(DISTANCE_UNITS) }),
  z.object({ type: z.literal("calories"),    value: z.number().int().positive() }),
])

RESULT_DIRECTIONS: Record<ResultType, "lower"|"higher"> = {
  time:"lower", rounds_reps:"higher", load:"higher", max_reps:"higher", distance:"higher", calories:"higher",
}
```

Direction is intrinsic (not stored) — drives PR-detection + graph orientation.

### 1.2 OneRMRecord → history (D-STATS records = best-of)

- **Prisma:** DROP `@@unique([userId, exerciseId])` → many records per (user, exercise) = history. Keep `source` (MANUAL/AUTO_INFERRED/TESTED) — the honest-metrics signal. Add `@@index([userId, exerciseId, recordedAt])`.
- **Contracts (new `one-rm-record` entity, mirror plan-enrollment):** `oneRMRecordSchema` + `createOneRMRecordSchema` (exerciseId, valueKg, recordedAt, source) + source enum schema + labels.
- **Current 1RM = DERIVED** (max valueKg; tiebreak latest recordedAt). `valueKg` Prisma `Decimal` → `number` in the mapper.

### 1.3 Load resolver (D-LOAD-RESOLVE) — `lib`, not an entity

`resolveLoad(load, athleteCtx)`:

- `absolute` → kg as-is. `bodyweight` → athlete bodyweight (profile field — confirm/add).
- `percentage {value, reference}` → **HWPO flow.** Look up the athlete's current 1RM (derived §1.2) of `self` / `other_exercise`. Have it → `kg = oneRM × value/100` (athlete sees kg). Missing → return `{ unresolved, prompt: "set 1RM", exerciseId }` so the UI shows the % + an inline **set-1RM** affordance; setting it creates a `MANUAL` `OneRMRecord` → re-resolves to kg immediately.
- `byProfile {axes, cells}` → cell picked by athlete profile — **RESOLVED (D-PROFILE-SELECTIONS):** the athlete picks his cell once; the pick is REMEMBERED in `AthleteProfile.profileSelections Json?` (a `{axisName → value}` map, free-string-keyed, on the existing `coaching/athlete-profile` PUT). resolveLoad matches each `cell.coords[i]` against the remembered value for `axes[i].name`; any axis unmatched → `unresolved` naming the axes. (Supersedes the earlier "render-time, no storage" — the resolved kg isn't stored, but the PICK is; re-homes to a catalog profile-type id when the profile-catalog wave lands.)

Used at: plan-view render + logging prefill.

### 1.4 Records / PR derivation (D-STATS) — `lib` + query

Best-of per (athlete, benchmark schema) by `RESULT_DIRECTIONS[type]` (min for time, max otherwise), derived not stored. PR = a new result beats the prior best by direction (render/notify flag). PR graph = the result time-series. **Leaderboard (surfaced):** the same best-of, ranked across athletes per 1RM / per benchmark — coach AND athletes; derived from these records, a later wave.

### 1.5 Date-thread (D-DATE-THREAD)

- **Prisma:** `PlanEnrollment.hidePastBeforeBoarding Boolean @default(false)` (cut point is the existing `boardedAt`).
- **Contracts:** `planEnrollmentSchema` + `createPlanEnrollmentSchema` gain the flag (optional on create, default false).
- **Athlete plan-view:** when true, hide cars dated before `boardedAt`. Future not gated. Read-filter, not a mutation.

### 1.6 Benchmark marker (D-BENCHMARK-MARKER)

- **Contracts:** `compositionSchema` gains `benchmark: z.object({ resultType: z.enum(RESULT_TYPES) }).nullable().optional()` (rides in composition beside `cap`; the 6 kinds untouched). NB: this touches the just-frozen primitive (`composition`) — owner-ratified.
- **Mappers/handlers:** none new — `mapToSchema`'s `compositionSchema.parse` + schema create/update marshal `composition` already.
- **Editor/render:** a GREEN chip beside the cap chip on the schema head (green via theme token, NOT a hex — `no-hex-outside-theme`); a benchmark toggle + result-type select in the schema axis editor.

## 2. Forks — RESOLVED (see decisions.md)

- **Benchmark placement** → D-BENCHMARK-MARKER: `composition.benchmark`, green chip. ✓
- **Logging granularity** → D-LOGGING-MINIMAL: tick + benchmark result; no per-row actuals in MVP. ✓
- **Percentage resolve** → D-LOAD-RESOLVE: HWPO flow + inline-1RM-capture. ✓
- **Publish** → D-PUBLISH-MODEL: version/publish-gate over a live plan. ✓
- **byProfile cell pick** → RESOLVED (D-PROFILE-SELECTIONS): pick-once-remembered, stored in `AthleteProfile.profileSelections`. ✓

## 3. Performed\* redesign — LOCKED (minimal, D-LOGGING-MINIMAL)

- **`PerformedSession`:** DROP `@@unique([sessionId,userId])` (D-LAYERS — unlimited performances = history); replace `startedAt`/`completedAt` with a single `performedAt` (post-workout, no in-workout timing); keep `athleteNotes`/`coachNotes`; add `@@index([sessionId,userId,performedAt])`. The compliance tick (D-STATS, first + sticky) = the earliest performance (derived) or a cached `firstCompletedAt` — confirm in build.
- **Benchmark result:** a `PerformedSchemaResult { performedSessionId, plannedSchemaId, result }` (result per §1.1) — attaches to the performed SCHEMA (a benchmark is a schema, not the whole session). Created only when the schema's `composition.benchmark` is set.
- **NO `PerformedExerciseInstance`** in MVP (D-LOGGING-MINIMAL) — drop the per-row actuals path; revisit post-MVP.
- **Contracts (new `performed-session` + `performed-schema-result` entities, mirror plan-enrollment):** schema/create + api.schema + barrels. Writes are athlete-side (`withAthleteAuth`), under `api/platform/athlete/...`.

## 4. Touch-points (mirror plan-enrollment verbatim)

Per new entity: entity folder (schema/create + api.schema + constants + types + index) → add to lms entities barrel → Prisma model + relations → `mapToX` mapper (+ enum map; Decimal→number) → `lmsXApi` handler → Next routes (`withAthleteAuth` for logging/1RM; `withCoachAuth` for the benchmark marker + publish). The benchmark marker + the date-thread flag are edits to EXISTING entities (composition, plan-enrollment), not new ones.

## 5. Adversarial pass

- D-channels: every typed field has a live reader NOW — result → records/graph/leaderboard; resolver → render; date-flag → filter; benchmark.resultType → logging + records. ✓ no inert field.
- D-LAYERS: unlimited performances (unique dropped) ✓; billing untouched (Phase 5) ✓.
- D-STATS: tick=first/sticky, records=best (derived), history=all rows ✓.
- Primitive touch: only `composition.benchmark` (D-BENCHMARK-MARKER, gated) — resolver/result/1RM/Performed are athlete-side.
- Coarse wave: §1 + §3 + resolver + date-thread + benchmark-marker ship as ONE block-1 `/feature`. Leaderboard + per-row actuals + benchmark catalog split off.
- byProfile cell-pick (§1.3) — RESOLVED (D-PROFILE-SELECTIONS): the resolver's byProfile branch is final (remembered pick in `AthleteProfile.profileSelections`, free-string-keyed).
