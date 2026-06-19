# athlete-core — block 2, screen 2 (Session / Workout View) — `/feature` (full) prompt

**For the executor session.** A cross-layer vertical slice that makes the athlete **training screen fully working in ONE run** — the session/workout view (read-only plan content) + load resolution (all 4 states, closed **inline**) + logging (Mark-completed / benchmark Log-result). **Owner directive (this wave):** close the 1RM / benchmark / profile resolve-holes in this single run, cross-domain work included — the athlete training screen must end up fully working, not a read-only stub. Wrap via `/feature` (full — it spans an api-server move + a new read endpoint + a contract + a hook + a UI module + logging mutations + a route).

This builds directly on screen 1 (Plan Timetable, shipped `feat/athlete-plan-timetable`, decisions `D-TT-*`). The timetable's card tap (`onOpenSession(sessionId)`, currently a no-op in `plan-timetable-board.tsx:99`) is the entry point.

---

## 0. Two SSOTs — visual language vs domain data (read this first, it governs the whole build)

- **The Claude Design prototype is the SSOT for the VISUAL LANGUAGE** — layout, spacing/density, component vocabulary, rhythm, color semantics, typography, the look of a card / row / chip / bottom-sheet / button. Reproduce it faithfully, **native** (MUI 7 + `@repo/ui` + theme tokens; **NO hex, NO transplanted HTML/CSS**).
- **Our contracts (`packages/contracts/src/entities/lms/…`) + `initiatives/athlete-core/decisions.md` are the SSOT for the DOMAIN & DATA** — which fields exist, which states a value can be in, which forms, which rules.
- **Why the split matters:** Claude Design _had_ the repo (it saw the contracts/domain model), but may not have leaned on it hard, and it did **not** have our ratified decisions (`D-*`) or this initiative's design dialogue. So the prototype's **data content is illustrative, not frozen** — it can under-cover or mis-model a domain case (e.g. show load as a flat "85 kg" unaware of the 4 resolve states; omit a result-type form; drop the intensity line; miss the benchmark marker).
- **Conflict rule:** where the prototype under-covers or contradicts the domain, **THE DOMAIN MODEL WINS** — extend the prototype's visual language to cover the case _in the same idiom_. Never drop a domain state to match the prototype; never invent a new visual idiom the prototype doesn't establish. If a real domain case has no prototype pattern, that's a **design gap to flag at acceptance**, not a guess to bury.

The domain cases §3 lists below are MANDATORY coverage regardless of whether the prototype shows them.

---

## 1. The design

Import the Claude Design project via the connector and read the session/workout `.dc.html` file(s):
`https://claude.ai/design/p/2d57f2e4-cd74-4184-9c9e-746f83266a60`

Implement it **visually faithfully but as a native build** — MUI 7 components, `@repo/ui` primitives, theme tokens for every color/spacing/typography value. The result must look like the approved design AND read like the rest of the codebase. Owner does a **side-by-side walkthrough vs the prototype** at acceptance (visual fidelity is a gate) **and** checks that every domain state below works on real data (domain completeness is the other gate).

---

## 2. What this slice is

The athlete taps a session card on his timetable and lands on the workout: the session's content (blocks → schemas/workouts → exercise rows), each load shown as a concrete number where his data allows, the resolve-holes closed inline, and a one-tap way to log that he did it (plus a typed result for a benchmark). He's on his phone at the gym — **mobile-first, big tap targets, fast paths, minimal typing.**

---

## 3. Read FIRST — verbatim anchors (trust these; they're quoted from current `main`)

### 3.1 The load resolver (block-1 deliverable — its production caller is THIS screen)

Currently at `packages/api-server/src/endpoints/coaching/athlete-records/` (`resolve-load.ts`, `load-records.ts`, `derive-records.ts`, `athlete-records.types.ts`, `index.ts` + tests). **§4.A moves it to `lms/` — build against the post-move location.**

```ts
// athlete-records.types.ts
type AthleteLoadContext = {
  bodyweightKg: number | null;
  currentOneRMByExercise: Map<string, number>;
  profileSelections: Record<string, string>;
};
type ResolvedLoad =
  | { status: "resolved"; kg: number; perHand: boolean }
  | { status: "unresolved"; reason: "missing_one_rm";      prompt: "set_one_rm";   exerciseId: string }
  | { status: "unresolved"; reason: "missing_profile_pick"; prompt: "pick_profile"; axisNames: string[] }
  | { status: "not_applicable" };

// resolve-load.ts — PURE, no DB
resolveLoad(load: Load, ctx: AthleteLoadContext, rowExerciseId: string): ResolvedLoad
//  absolute    → resolved {kg, perHand: count===2}
//  bodyweight  → CURRENT (BUGGY): null ? not_applicable : resolved {kg: bodyweightKg}  ⚠ §4.A FIXES this → a 'bodyweight' status rendered as a LABEL, never the profile weight
//  percentage  → exercise = self ? rowExerciseId : reference.targetExerciseId;
//                oneRM missing → unresolved/missing_one_rm{exerciseId}; else resolved {kg = round1(oneRM*value/100)}
//  byProfile   → any axis the athlete hasn't picked → unresolved/missing_profile_pick{axisNames};
//                else match cell by picked coords → resolved {kg}

// load-records.ts — the async ctx builder (fetch-once, no N+1)
loadAthleteLoadContext(userId: string, exerciseIds: string[]): Promise<AthleteLoadContext>
//  fetches AthleteProfile {weightKg, profileSelections} + OneRMRecord rows (max valueKg per exercise);
//  imports profileSelectionsSchema from @repo/contracts/coaching/athlete-profile
```

`percentage` resolves only from `load.value` — **`rangeMax` (the upper bound of a `%` range) is ignored by the resolver.** If a row's load is a `%` range, the UI still shows the resolved kg from `value`; surface the range honestly (see §3.3). `absolute` with `count===2` ⇒ `perHand:true` (e.g. "2×24 kg / hand").

### 3.2 The `Load` union — `packages/contracts/src/entities/lms/_shared/load.ts`

```
absolute   { kind, count: 1|2, kg }
percentage { kind, value: 0–200, rangeMax?: 0–200, reference: {scope:"self"} | {scope:"other_exercise", targetExerciseId} }
bodyweight { kind }
byProfile  { kind, axes: [{name, values[]}] (1–2), cells: [{coords[] (1–2), kg}] }   // cells cover the full cartesian product
```

### 3.3 The exercise row — `packages/contracts/src/entities/lms/schema-row/schema-row.schema.ts`

```
schemaRowSchema = { id, schemaId, order, exerciseId, sets: int|null, rowGroupId|null,
  load: Load|null, reps: repNotation|null, side: perLimbDistribution|null, tempo: tempoModifier|null,
  media: mediaReference|null, intensity: Intensity|null, rest: restSpec|null,
  modifiers: modifierRef[], notes: notesList|null, createdAt, updatedAt }
```

Every prescription field is **nullable — render only what's present.** `exerciseId` needs a JOIN to `Exercise` for the movement name (+ any media). **`intensity`** is its OWN field (not part of load) — `packages/contracts/src/entities/lms/_shared/intensity.ts`, a `{effortPercent? | rpe? | pace? | hrZone? | numericPace?}` (≥1 dim). Render it as the prototype renders intensity; cover all 5 dims.

### 3.4 Schema + composition + benchmark — `packages/contracts/src/entities/lms/composition/composition.schema.ts`

```
compositionSchema = { repetition?: <6 kinds>, rest?: timeCap, cap?: timeCap, benchmark?: { resultType } | null }
//  6 repetition kinds: once | count | ladder | timeCap | cadence | interval
//  benchmark != null  ⇒ this schema is GRADED → green chip + result type; primary action = "Log result"
//  benchmark == null  ⇒ ordinary schema → primary action = "Mark completed"  (D-BENCHMARK-MARKER, D-STATS)
```

`composition` lives on the **Schema** (a Json scalar — arrives with the schema, not a relation). A session can hold **several schemas, some benchmark, some not.**

### 3.5 Result types (benchmark logging) — `packages/contracts/src/entities/lms/_shared/result.ts`

```
resultSchema = discriminatedUnion("type"):
  time        { seconds: >0 }                         // For Time   — design a mm:ss input
  rounds_reps { rounds: int≥0, reps: int≥0 }          // AMRAP      — two number inputs
  load        { kg: >0 }                              // For Load   — one number input
  max_reps    { reps: int>0 }                         // Max reps   — one number input
  distance    { value: >0, unit: "m"|"km" }           // For distance — number + unit
  calories    { value: int>0 }                        // Calories   — one number input
RESULT_DIRECTIONS: time→lower, everything else→higher  // (PR orientation; not asked of the athlete)
```

A schema's `composition.benchmark.resultType` **fixes which ONE form to show** — don't offer a type picker. All six forms must exist.

### 3.6 Write paths (block-1 — ALL exist, athlete-side, `withAthleteAuth`)

```
POST /api/platform/athlete/performed-sessions
     body createPerformedSessionSchema = { sessionId, performedAt, athleteNotes?:string|null }   // performedAt = client `new Date()`
POST /api/platform/athlete/performed-sessions/[performedSessionId]/result
     body createPerformedSchemaResultSchema = { plannedSchemaId, result }     // result per §3.5
POST /api/platform/athlete/one-rm-records
     body createOneRMRecordSchema = { exerciseId, valueKg, recordedAt, source }   // source = OneRMRecordSource.MANUAL, recordedAt = now
PUT  /api/platform/athlete/profile
     body updateAthleteProfileSchema = { weightKg?, profileSelections? }     // profileSelections = Record<string,string> (free-string keys)
```

Server-side guards already enforced (D-RESULT-RELATION): result-create verifies performed-session ownership (cross-athlete → Forbidden), schema-is-benchmark, schema-belongs-to-the-session, `result.type === composition.benchmark.resultType`, one result per (performed-session, schema). **`@@unique([performedSessionId, plannedSchemaId])` ⇒ a repeat benchmark log is a NEW performed-session + a new result** (D-STATS: every performance is history; best→profile).

### 3.7 App hooks (block-1 — EXIST, in `apps/platform/src/lib/hooks/`, but NOT yet in the `index.ts` barrel)

`useCreatePerformedSession` · `useCreatePerformedSchemaResult` · `useOneRMRecords(exerciseId?)` + `useCreateOneRMRecord` (already invalidates the 1RM list). Wire them up (and add the missing exports to the `lib/hooks` barrel + `lib/api/endpoints` clients exist: `performed-sessions.ts` / `performed-schema-results.ts` / `one-rm-records.ts`). **No athlete-profile hook exists yet — add one (GET + PUT) over the existing route.**

### 3.8 Patterns to mirror

- **The derived-view read pattern:** `packages/api-server/src/endpoints/lms/plan-timetable/` — a pure builder (`build-plan-timetable.ts`) + a fetch wrapper (`plan-timetable.ts`, the prisma include + N+1-free batch) + types + index; the route `apps/platform/src/app/api/platform/athlete/plan-timetable/route.ts`; the hook `use-plan-timetable.ts` + client `lib/api/endpoints/plan-timetable.ts`; the module `apps/platform/src/modules/plan-timetable/`. **Build screen 2 in the same shape.**
- **The schema-body include:** `packages/api-server/src/endpoints/lms/_shared/schema-body-include.ts` = `{ rows: { orderBy:{order:asc}, include:{ modifierAssignments:{include:{modifier:true}} } }, rowGroups: true }`. Mirror + extend it (add the blocks layer + `exercise` per row).
- **Decisions** (`initiatives/athlete-core/decisions.md`): `D-LAYERS` (free nav, re-do any car), `D-STATS` (sticky-first done; benchmark best-of), `D-LOGGING-MINIMAL` (≤2 actions, no per-row actuals), `D-RESULT-TYPES`, `D-LOAD-RESOLVE` (HWPO inline-1RM), `D-PROFILE-SELECTIONS` (remembered pick), `D-RESULT-RELATION`, `D-TT-DATES-ABSOLUTE` (tz rule — §5), `D-TT-NO-COACHING-EDGE` (§4.A).

---

## 4. Scope (the vertical slice)

### A. [ENABLING — do this first] Move the load-resolver family `coaching/` → `lms/`

`endpoints/lms/*` MAY NOT import `endpoints/coaching/*` (dep-cruiser `api-server-lms-no-coaching`, enforced pre-push by `pnpm dep:check`). The session-view endpoint lives in `lms/` (athlete reads are lms, per `D-TT`) and must call `resolveLoad` — so the resolver must live in `lms/`.

- Move `resolve-load.ts` + `load-records.ts` + `derive-records.ts` + `athlete-records.types.ts` + `index.ts` + their tests from `endpoints/coaching/athlete-records/` → `endpoints/lms/athlete-records/`. Remove the re-export from `coaching/index.ts`; add it to `lms/index.ts`. Its only consumer today is that barrel (grep-verified — no real prod caller; the libs were built ahead for this screen).
- The `load-records.ts` import of `@repo/contracts/coaching/athlete-profile` (`profileSelectionsSchema`) **stays and is legal** — the dep-cruiser bans are `endpoints/lms → endpoints/coaching` and `contracts/lms → contracts/coaching`; an lms-endpoint importing a coaching-_contract_ matches neither.
- After the move: `pnpm dep:check` clean, `check-types` clean (catches any missed importer). This is `D-TT`-aligned and keeps block-3 coach-metrics legal (coaching→lms is a forward edge).

**While in the resolver, also FIX bodyweight semantics (`D-AC-BODYWEIGHT-LABEL`):** the shipped block-1 branch substitutes the profile weight — `bodyweight → resolved {kg: bodyweightKg}` — so a bodyweight movement shows "88 kg" (the athlete's own weight), mis-signalling external iron ("Air Squat 100 kg" is nonsense — the body is the implement, not iron). Change it: a `bodyweight` load resolves to a distinct **`bodyweight` status** (a new `ResolvedLoad` variant) that the UI renders as a «Bodyweight» / «со своим весом» label, **never a kg number**. `weightKg` stays in the context (coach tonnage analytics + the future %-of-bodyweight reference) but no longer flows into a bodyweight prescription line. Update the resolver tests + the contract `ResolvedLoad` re-expression accordingly.

### B. [READ] Session-view aggregate endpoint (`lms/`, derived view — mirror `plan-timetable`)

`GET /api/platform/athlete/sessions/[sessionId]`, `withAthleteAuth`. A pure builder + a fetch wrapper:

- **Access guard (security — IDOR):** resolve `sessionId` up its tree `session → day → week → plan → PlanEnrollment{athleteId, status:ACTIVE}`. If the caller isn't an active enrollee of the owning plan → `NotFound` (don't leak existence). Honor the **date-thread**: if `enrollment.hidePastBeforeBoarding` and the session's date < `boardedAt` → `NotFound` (consistent with the timetable hiding it).
- **Fetch (no N+1):** the session subtree — `blocks (order asc) → schemas (order asc, composition) → rows (SCHEMA_BODY_INCLUDE + exercise)` — plus the parent `day.dayOfWeek` + `week.startDate` + plan title (for the header date, §5) in ONE query; then `loadAthleteLoadContext(athleteId, exerciseIds)` ONCE; then `performedSession.findMany` for this session+athlete to derive **done** and any existing benchmark results.
  - **`exerciseIds` = every `row.exerciseId` ∪ every `percentage.reference.targetExerciseId`** (other-exercise % needs the target's 1RM in the ctx) — miss this and other-exercise % silently won't resolve.
- **Resolve server-side:** for each row with a `load`, compute `resolveLoad(load, ctx, row.exerciseId)` → attach the `ResolvedLoad` to the row in the view shape. The client does ZERO resolution/date math (presentation-only — `D-TT-SERVER-COMPUTES`).
- The view shape carries: session header (absolute date per §5, title from label, done flag) → blocks → schemas (composition incl. `benchmark`, `isBenchmark`, `resultType`, existing logged result if any) → rows (movement name + sets/reps/`resolvedLoad`+raw load/intensity/tempo/side/rest/media/modifiers/notes).

### C. [CONTRACT] The session-view response entity

New derived-view contract under `packages/contracts/src/entities/lms/` (mirror `plan-timetable/`'s structure: schema + api.schema + types + index; add to the lms entities barrel). Keep it Prisma-free; the `ResolvedLoad` shape is re-expressed as a contract type (don't import the api-server type into contracts).

### D. [HOOK] Client read hook + endpoint client

`use-athlete-session-view(sessionId)` (TanStack query) + `lib/api/endpoints/*` client, mirroring `use-plan-timetable`. Plus the **new athlete-profile hook** (GET current `{weightKg, profileSelections}` + PUT). Add all new hooks to the `lib/hooks` barrel.

### E. [UI] The session/workout view module

`apps/platform/src/modules/athlete-session/` (one component per file, `@repo/ui` + MUI + tokens). The read surface: session header → blocks → schema cards → exercise rows. **Mandatory domain coverage (§0):**

- **Load — every `ResolvedLoad` state, every row:** `resolved` → the kg (+ "/ hand" when `perHand`); `missing_one_rm` → the `%` + an inline **"set your 1RM"** affordance; `missing_profile_pick` → a **"pick your profile"** affordance (names the axes); **`bodyweight` → a «Bodyweight» / «со своим весом» LABEL, never a kg number** (`D-AC-BODYWEIGHT-LABEL` — the body is the implement, not iron); `not_applicable` → no load line (exhaustive-guard fallback). A `%` _range_ (`rangeMax`) shows the resolved kg honestly as a range/“from”.
- **Benchmark schema** → the **green chip** (theme semantic green token, never hex) + the result type; primary action **"Log result"**. Ordinary schema/session → **"Mark completed"**.
- **Intensity / tempo / reps / sets / side / rest / modifiers / notes / media** rendered when present (all nullable).
- The action **never disappears** (re-do any time — `D-LAYERS`); a **done** session shows done state but stays re-loggable.

### F. [LOG] Logging (the 30-second floor — `D-LOGGING-MINIMAL`)

Bottom-sheet / single modal, **not** a wizard.

- **Mark completed (ordinary):** ONE tap → `POST performed-sessions {sessionId, performedAt: new Date(), athleteNotes?}`. Optional note. On success: toast + invalidate the session-view + timetable queries (the done tick is sticky — `D-STATS`).
- **Log result (benchmark):** the typed form for `composition.benchmark.resultType` (§3.5 — exactly one of the six). Submit ⇒ create a performed-session, then `POST …/[performedSessionId]/result {plannedSchemaId, result}` (a new performed-session + result each time — `@@unique` per §3.6). Multiple benchmark schemas in one session → a result is logged **per schema** (`plannedSchemaId`). Optional note.
- Surface server validation errors honestly (the result-type / ownership / session-link guards in §3.6).

### G. [1RM] Inline set-1RM (closes the `missing_one_rm` hole)

From the `set your 1RM` affordance: a minimal input (kg) → `POST one-rm-records {exerciseId, valueKg, recordedAt: new Date(), source: MANUAL}` → invalidate the session-view + `oneRMRecords` queries → the load **re-resolves to kg in place** (HWPO flow, `D-LOAD-RESOLVE`).

### H. [PROFILE] Inline pick-profile (closes the `missing_profile_pick` hole)

From the `pick your profile` affordance: present the unpicked axis/axes with their `values` (from the row's `byProfile` load) → on pick, **merge** `{[axisName]: value}` into the athlete's existing `profileSelections` (read current, merge, don't clobber other picks) → `PUT athlete/profile {profileSelections}` → invalidate → the cell resolves to kg in place. The pick is remembered (`D-PROFILE-SELECTIONS`) and reused across rows/schemas.

### I. [NAV] Wire the entry point + route

`onOpenSession` (timetable, currently no-op) → `router.push('/athlete/session/[sessionId]')`. Add the route + page under `apps/platform/src/app/athlete/…` following the `(home)`/`(secondary)` `AthleteShell` split (a focused content page — pick the padded variant unless the design says otherwise). Provide a back affordance to the timetable.

### J. [DATA] A dev fixture plan for the walkthrough

So the owner can see every state on real data, provide a dev-only fixture (or extend the seed scenario) enrolling the test athlete in a plan whose sessions exercise: a `%`-of-1RM row (self + other-exercise), a `byProfile` row, an `absolute` (incl. per-hand), a `bodyweight` row, an ordinary schema, and ≥1 benchmark schema per result type you can reasonably cover. The integration test self-fixtures (mirror screen 1); the seed stays `users+profiles` otherwise.

---

## 5. Sacred / constraints

- **§0 governs:** prototype = visual language; contracts + decisions = domain/data; domain wins on conflict; cover every domain state.
- **Dates are tz-stable (`D-TT-DATES-ABSOLUTE`).** Any calendar date in the session header (the session's day/date) is ABSOLUTE — server emits `dayOfMonth` (UTC day of `week.startDate + dayOfWeek offset`); the client renders the weekday from the `dayOfWeek` enum and any range via `Intl { timeZone:"UTC" }`. Only "today"/done detection may use the athlete tz, server-side. (Sub-UTC off-by-one was the screen-1 bug — don't reintroduce it.)
- **`lms` ↛ `coaching`** (`api-server-lms-no-coaching`, pre-push `dep:check`). §4.A makes the resolver lms-local; the session-view inlines anything it needs (e.g. the label→title / weekday-offset helpers, copying from lms like the timetable did — `D-TT-NO-COACHING-EDGE`).
- **Theme tokens only — no hex, no ad-hoc inline colors, no transplanted HTML** (`no-hex-outside-theme`, `pattern-compliance`). The benchmark chip uses the theme's semantic green.
- **One React component per file.** **Mobile-first** (phone at the gym; big tap targets, glanceable). **No N+1** in the read (one batched subtree fetch + one ctx fetch + one performed fetch).
- **Server computes, client presents** (`D-TT-SERVER-COMPUTES`) — all resolution + date math server-side; the view is dumb.
- **No per-exercise actuals** (`D-LOGGING-MINIMAL`) — logging is the completed tick + the benchmark result only.
- **Schema-driven typed forms** for the result entry (per discriminator) — never a raw JSON editor (`no-json-editor-in-ui`).

---

## 6. Out of scope (other waves — do NOT build here)

- The standalone **Records / PR-history screen** and the standalone **Profile-management screen** (block-2 screens 3-4; own nav, currently "Coming soon"). Inline set-1RM + pick-profile close the resolve holes on the training screen itself — the dedicated screens are the next wave.
- The **benchmark / template / profile-type CATALOG** (admin CRUD, fusion form, save-as/use-as) — the deferred library wave; free-string profile axes suffice here (`D-PROFILE-SELECTIONS`).
- **% of bodyweight** as a load reference (sled / carry "100% BW") — a NEW `percentageReference` scope `"bodyweight"`; its own load-model mini-wave (the `load.ts` primitive + the resolver branch + a coach load-editor control + the athlete render, done together so the field isn't inert). Owner-agreed real gap (percentage today references only 1RM self/other), NOT this screen (`D-AC-BODYWEIGHT-LABEL` deferred note).
- **Plan publish / version gate** (`D-SCOPE-PUBLISH`) · cross-athlete **leaderboard** · per-exercise actual logging · in-workout timers/scoring engine.
- Coach-side date-display tz fix (the latent `DayRowHead` bug) — a repo-wide pass, not this slice.

---

## 7. Acceptance

- An enrolled athlete taps a timetable card → the workout opens on **real data**: blocks → schemas → rows, every load shown in its correct resolve state, the benchmark green chip + result type present.
- **Inline holes close end-to-end:** set-1RM turns a `%` into kg in place; pick-profile turns a `byProfile` cell into kg in place (and is remembered).
- **Logging works:** "Mark completed" sets the sticky done; "Log result" records a typed benchmark result (correct form per result type); a repeat logs new history.
- Access guard holds (a non-enrollee / past-of-boarding session → not found); the date header is tz-stable.
- **Owner side-by-side walkthrough:** visual fidelity to the prototype holds AND every domain state above works.
- `pnpm dep:check`, `check-types`, `lint` clean; the read endpoint + resolver-move covered by the gated api-server suite (green on reseed); close-out docs land **in** the feature PR.

---

## 8. Process

`/feature` (full), one wave. `db:reset` world, no migration files. The orchestrator reviews every implement wave via `git diff` (never agent self-report). Keep waves coarse but quality-first. Ratify any new build decisions into `decisions.md` (notably the resolver→lms move) and land the close-out in the PR (`closeout-before-pr`). ≤1 full `/feature` per session.
