# Training Plan Domain — Design Notes

> **Status:** Live design document. Will be promoted to ADR(s) once the model freezes for build.
> **Last updated:** 2026-05-05

Decisions here are co-signed by Maksim (coach context + product holder) and Claude (tech lead). Each section is marked `agreed` when both have committed or `open` when actively under discussion. Detail is added top-down: large masses first, contours next, fine lines last.

---

## The four masses (`agreed`)

The domain is shaped by four mostly-independent abstractions. Detail rounds expand each mass below.

### 1. Plan-as-rail

A `Plan` is a **named timeline of training days, owned by one coach**. It has no inherent start or end — the coach lays sleepers forward over time (and may extend historically backward). The rail exists independently of athletes and of content; an empty plan is a valid plan. **Time is the primary axis; everything else is composition over time.** Calendar weeks are a UI grouping, not a domain primitive.

### 2. Library

Plan content is **not authored as free text**. It is assembled from a catalog of named primitives — exercises, block types, scheme types. The library is a concern separate from any single plan; a primitive can be referenced by many plans across many coaches. Library entries are open-ended (any COACH-role user may extend the catalog), but the technical primitives that drive UI rendering and analytics validation remain a closed set under the hood.

### 3. Passengers

Athletes **board** a plan at a specific calendar date and ride it forward. **Multiple boardings on the same plan never alter the plan's shape** — the rail is the rail. The mental categories "individual plan" / "split" / "group programming" live only in the coach's head, never in domain types. Per-athlete personalization is, by default, achieved by the coach creating a separate plan; in-plan overrides are deferred beyond MVP.

### 4. Completion snapshot

When an athlete marks a workout done, a **frozen JSON snapshot** of the prescribed structure (plus the athlete's actuals) is captured into `WorkoutSession` / `BlockSession` / `ExerciseLog` / `SetLog`. Plan content remains freely mutable forever; the snapshot is immortal. **Analytics reads only from snapshots, never from the live plan tree.** This obviates plan versioning entirely.

---

## Detail rounds

### Round 1 — Plan-as-rail (`agreed`)

#### Decomposition

```
Plan → Day → Session(s) → Block(s) → Item(s)
```

Four levels, no fewer, no more.

- **Day** — a single calendar date on the rail. A container; may be empty, may carry a type label, may host one or more sessions.
- **Session** — one training event ("morning yoga", "afternoon weightlifting", "evening stretch"). The boundary at which an athlete clicks "start" and "complete". Multiple sessions per day are first-class; the schema does not assume one.
- **Block** — a composition unit drawn from the library. The block carries one or more `BlockType` references (composite block-typing is normal — coaches write "STRENGTH ENDURANCE | Gymnastics" as a single block, not two), one `SchemeType` reference, scheme parameters, items, and optional modifiers. The library entries the block references are live links; the block stores what cannot live in the library (per-prescription parameters, item ordering, ad-hoc modifiers).
- **Item** — an atomic exercise prescription: one library exercise + reps + load + tempo + variation.

#### Rest days and day types

A rest day is **the absence of any training in the model**. There is no `isRest: bool` flag and no business rule that ties a day type to session count.

For UX the coach can attach an optional `DayType` library reference to a day to convey intent ("Rest Day", "Active Recovery", "Legs Day", "Skills Day"). DayType is a **dumb label** — the code knows nothing about what "Rest Day" means. The coach may assign a DayType and zero sessions, or a DayType and five sessions; both are valid. Display logic only decides whether to show the label and the sessions; it does not enforce the relationship.

A `PlanDay` row exists if and only if the coach put something on that date — either a DayType, at least one session, or both. Otherwise the date has no row.

#### Lifecycle

```
DRAFT ──► ACTIVE ──► ARCHIVED
```

- **DRAFT** — plan is being assembled. Athletes cannot board; non-creator users cannot view content.
- **ACTIVE** — athletes can board; boarded athletes see content forward from their boarding date.
- **ARCHIVED** — read-only. No new boardings. No content edits. Existing snapshots from past completions remain fully accessible — they belong to the athlete, not the plan.

Archiving is freezing, not deletion. Soft-delete (`deletedAt`) is orthogonal — that is for cleanup, not lifecycle.

#### Mutability

The coach may edit **any** day on the rail — past, present, future — at any time, while the plan is in DRAFT or ACTIVE. There are no "freeze past days" rules and no edit warnings around historic content. This is safe because completion snapshots (see Mass 4) capture prescribed state at the moment of athlete `started`, so coach edits never reach into historical truth.

#### Two-event session lifecycle

Each `Session` an athlete consumes has two discrete events:

1. **`started`** — athlete clicks "begin". Backend captures a frozen JSON snapshot of the prescribed tree (Session → Blocks → Items) into `WorkoutSession` / `BlockSession` / `ExerciseLog`. From here on, the athlete's session is decoupled from the live plan tree.
2. **`completed`** — athlete clicks "done". `completedAt` is recorded; duration becomes derivable.

Snapshot timing is `started`, not `completed`, so:

- Coach edits during the athlete's session don't disturb the in-progress snapshot.
- Abandoned sessions (`started` without `completed`) still carry a snapshot + partial actuals → analytics can distinguish "tried" from "finished".

Derived analytics primitives this enables:

- `duration = completedAt - startedAt`
- `attempts` (sessions started) vs `completions` (sessions completed)
- `streak` = consecutive days with ≥1 completed session
- `abandon rate` per window

Live plan tree answers "what should I do today?". Snapshot answers "what did I actually do?". The two never collide.

#### Abandoned sessions

A `WorkoutSession` with `startedAt` set, `completedAt` null, and a plan-day date in the past is considered **abandoned**. There is no `abandonedAt` field, no status enum entry — the abandoned state is derived from those three facts. There is no automatic "close abandoned" sweep — we do not finish sessions on the athlete's behalf.

The athlete may return later and mark such a session completed; backend records `completedAt = startedAt + 1h` (a deterministic placeholder duration) rather than fabricating a real duration. This trade is intentional: we accept lossy timing in exchange for letting the athlete close their own loop without UI friction.

There is **no per-day "one active session" lock** in MVP. If the athlete starts two sessions in parallel (e.g. two browser tabs, weird device behavior) the system tolerates it; observed race-condition risk is low and the constraint adds enforcement cost without clear value at this stage.

### Round 2 — Library (`agreed`)

#### Catalog scope and surface

The library lives **entirely in the admin app**, alongside other system catalogs (blog posts, products, users, reviews, pages, contacts). Library entries are CRUD entities following the same pattern: route under `/apps/admin/src/app/(dashboard)/<entity>/`, module folder under `/apps/admin/src/modules/<entity>/`, DataTable list view + react-hook-form create/edit, hooks via `createCrudHooks()`, server-side guarded with `withAdminAuth`.

Anyone with admin-app access may manage the library. In MVP that means `ADMIN` and `HEAD_COACH` (the latter has admin-app rights as super-admin). Regular `COACH` does not author library entries — they consume them in the platform.

The library is **one global catalog**, not per-coach. Name uniqueness is enforced **case-insensitively at create**. ID is the canonical identity; name is human display.

#### Entry types in MVP

Four library entry types. All other "templates" (e.g. preset blocks with bundled items, week templates) are deferred.

##### `Exercise`

```
{ id, name, urls: string[], primaryMovement: MovementPattern, benchmarkPrKind?: PrKind }
```

- `name` — admin-given.
- `urls` — 0..N video links, all equal in status. UI decides presentation.
- `primaryMovement` — required. Closed enum (`push`, `pull`, `squat`, `hinge`, `carry`, `locomotion`, `core`, `olympic`). The analytics axis for any future per-pattern rollups.
- `benchmarkPrKind` — optional FK to the closed `PrKind` enum. Set when this exercise has a tracked PR (e.g. Exercise "Back Squat" → `BACK_SQUAT_1RM`). Items prescribing `loadSpec.kind=PERCENT_BENCHMARK` only accept exercises whose `benchmarkPrKind` is set; the percent resolves against the athlete's `PersonalRecord` for that kind. `PrKind` is a closed enum — extending it is a code PR, not a self-service admin operation.

Other facets (`modality`, `bodyParts`, `defaultMetrics`) — deferred. Added when a concrete UI/analytics use-case demands them.

A separate `Benchmark` library entity (for named composite workouts like Fran, Murph — where the PR is best workout time) is **deferred entirely**. Coach prescriptions in MVP only use per-exercise percent benchmarks, never per-workout-time benchmarks.

##### `BlockType`

```
{ id, name, description? }
```

A label for a block role ("STRENGTH ENDURANCE", "PUMP SESSION", "WARM UP"). No suggested-schemes, no color, no metadata. Pure label.

##### `SchemeType`

```
{ id, name, archetypeKind: SchemeArchetypeKind, defaultParams?: Json }
```

Library entries are **abstract scheme templates**: "EMOM", "AMRAP", "Sets×Reps", "Rep Ladder", "RFT", "Chipper", "For Time", "Run Distance". Concrete instances ("EMOM 12 min", "21-15-9", "EMOM 20 / 4-min pattern × 5") are not separate entries; they are produced by filling parameters at use-time on the block.

`SchemeArchetypeKind` is a **closed enum** of technical primitives that drive UI rendering and parameter-shape validation. Adding a new archetype is a code PR.

After PDF pattern validation, the MVP archetype set is:

| Archetype       | Covers                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------ |
| `NONE`          | sets×reps, plain composition, accessory list                                               |
| `COUNT_UP`      | AMRAP / RFT / Chipper / For Time / Density (target = rounds/reps; capped or uncapped time) |
| `COUNT_DOWN`    | descending for-time variants                                                               |
| `LADDER`        | rep ladders — asc / desc / pyramid (params: `{ sequence: number[], direction }`)           |
| `EMOM_LOOP`     | every-minute on the minute, with REST as a valid slot, slot ranges allowed                 |
| `INTERVAL_LOOP` | work/rest cycles ("5x 2 min ON \| 2 min OFF")                                              |
| `TIME_BOXED`    | time-windowed segments ("0:00-10:00 \| 10:00-20:00"), skill practice                       |
| `DISTANCE`      | running prescriptions ("RUN 5 km", "RUN 5-7 km")                                           |

The two new archetypes (`LADDER`, `DISTANCE`) are a delta against the currently shipped six in `@repo/contracts/lms/_domain/scheme-archetype.schema.ts`. Within-block phases ("...then..." part 2) are handled by splitting into two sequential blocks in the same session, not by phases inside a single scheme — keeps schemeParams clean.

##### `DayType`

```
{ id, name, color: string }
```

Color is included in MVP to support visual differentiation in the calendar. The exact format (hex string vs MUI palette key) is an implementation choice; the design only requires that color exists.

#### Reference semantics

Library entries are referenced from plan content **by FK, as live links**. When a coach renames "PUMP SESSION" → "HYPERTROPHY SESSION" in the library, every plan referencing that BlockType immediately reflects the new name.

This is safe because of Mass 4: when an athlete starts a session, the snapshot freezes the displayed names of the entries in use. Past completions are not affected by future library renames.

#### Soft-delete behavior

Library entries support `deletedAt` soft-delete. Hard-delete is blocked if the entry is referenced anywhere in active plan content. Soft-deleted entries:

- remain readable for snapshots and historical UI;
- are filtered out of "create new block / pick exercise" pickers;
- show as "(deleted)" in plan trees that still reference them, until the coach replaces the reference.

This keeps simplicity in MVP while leaving room to add version history later if library entries start drifting.

### Round 3 — Passengers (`agreed`)

#### Boarding model

```
PlanEnrollment {
  id, planId, athleteId,
  boardedAt: Date,
  enrolledById,
  status: EnrollmentStatus,
  statusChangedAt: Date,
  deletedAt?
}

EnrollmentStatus = 'ACTIVE' | 'PAUSED' | 'REMOVED'
```

A flat M:N row. `boardedAt` is the date from which the athlete is associated with the plan. `enrolledById` records the coach (or, in future phases, the system user when billing auto-enrolls) who created the enrollment — needed for audit and for HEAD_COACH-on-behalf-of-COACH flows.

Status semantics:

- **ACTIVE** — athlete sees the plan forward from `boardedAt` within the visibility window; may start sessions.
- **PAUSED** — athlete sees the plan in a paused state; future sessions are not startable, past snapshots remain accessible. Coach resumes by flipping back to ACTIVE.
- **REMOVED** — enrollment is soft-deleted (`deletedAt` set, `status = REMOVED`); athlete no longer sees the plan. All historical snapshots remain attached to the athlete. If the athlete returns, the coach creates a **new** `PlanEnrollment` row with a fresh `boardedAt` — histories are not merged.

Pause / Resume = status flip on the same row. Remove = soft-delete + status update. Re-enrollment after remove = new row.

#### Visibility (MVP)

The domain places no bound on what the athlete may query. Bounding is a **product / UI rule**:

- **Window start:** Monday of the calendar week containing `boardedAt`. If the athlete boards on Tuesday, they see that week from Monday onward.
- **Window end:** today + 30 days. Sleepers the coach laid further out are not yet visible to the athlete.
- **Before the start:** invisible.

Rationale: subscription is monthly, so showing roughly a month forward matches the pricing cadence; week-aligned start matches the unit athletes mentally plan in. Coach-side UI is unbounded — coach sees the full rail. The window is a query filter applied only on the athlete app.

#### Concurrency: one active session per calendar day

Documented in Round 1 (Plan-as-rail / one-session-at-a-time). Cross-referenced here because it is the primary athlete-side concurrency rule.

#### Permissions matrix

The system has four roles, each with one app surface. Single-tenant — the project is built for one brand (TDP), no multi-org scoping.

| Role              | Admin app (`/apps/admin`)      | Coach platform (`/apps/platform`)                         | Athlete app                                    |
| ----------------- | ------------------------------ | --------------------------------------------------------- | ---------------------------------------------- |
| `ADMIN`           | full                           | —                                                         | —                                              |
| `HEAD_COACH`      | full (effectively super-admin) | full + read regular coaches' plans + enroll into any plan | —                                              |
| `COACH` (regular) | —                              | own plans only (CRUD + enroll into own)                   | —                                              |
| `ATHLETE`         | —                              | —                                                         | view enrolled plans, log sessions, own profile |

Library lives in the admin app; therefore only `ADMIN` and `HEAD_COACH` author it. Regular `COACH` is a consumer.

Notes:

- `HEAD_COACH` may enroll an athlete into any plan — own or any regular coach's — without first creating a `CoachAthleteAssignment`. The assignment, if needed for downstream queries, is created implicitly during enrollment.
- Athletes never create their own enrollment in MVP. Future flows: the marketing site sells a product = (platform access + access to a specific plan). Purchase auto-creates the athlete account and the enrollment via a system user; `enrolledById` accommodates this without schema change.

#### Un-boarding

An athlete leaves a plan via soft-delete on their `PlanEnrollment` (`deletedAt` set). Effects:

- The athlete's UI no longer surfaces the plan forward.
- All existing snapshots from completed (or abandoned) sessions remain attached to the athlete and continue to inform their analytics — those records belong to the athlete, not the plan.
- If the athlete later returns, the coach creates a **new** `PlanEnrollment` row with a fresh `boardedAt`. Two enrollments on the same plan = two tickets; we do not merge their histories at the domain level. Any "this athlete had two stints on this rail" UI is derived from the enrollment list.

#### Cardinalities

- One athlete ↔ many enrollments ↔ many plans ↔ many coaches.
- One coach ↔ many plans ↔ many athletes (via enrollments).
- One plan ↔ exactly one creator coach ↔ many enrollments.

The domain explicitly does **not** model:

- Conflict resolution when two enrollments prescribe sessions on the same date for the same athlete (UI shows both, athlete picks).
- Aggregated cross-plan dashboards (UI / analytics concern).
- Total weekly load across multiple plans (analytics concern).

#### Forward horizon

The domain places no upper bound on how far forward a coach may extend the rail. UI may paginate or lazy-load; the underlying tree is unbounded.

### Coverage check — coach PDF (`agreed`)

The reference coach's 33-week home-equipment programming PDF was used to validate that the model captures the recurring abstract patterns, not just the ones we anticipated. Counted distinct patterns: 38. Coverage:

| Group                                                                                                                             | Patterns | Covered without change | Covered after planned change                    | Deferred               |
| --------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------- | ----------------------------------------------- | ---------------------- |
| Block-level schemes                                                                                                               | 10       | 5                      | 5 (LADDER + DISTANCE archetypes added)          | 0                      |
| Special schemes (run, practice, yoga, density)                                                                                    | 4        | 3                      | 1 (DISTANCE archetype)                          | 0                      |
| Item-level (compound rep, per-set/per-stage variations, alternatives, open slot, intra-rep, tempo, ranges, sequences, max, total) | 12       | 12                     | 0                                               | 0                      |
| Block-level annotations (effort, M/F load, composite categories, phases, rest, notes)                                             | 8        | 7                      | 1 (`Block.blockTypeIds[]` array, not single FK) | 0                      |
| Cross-block anchors (named-landmark refs, after-each-round triggers)                                                              | 3        | 0                      | 0                                               | 3 (inline note in MVP) |
| Plan-level state (skip-block-per-week)                                                                                            | 1        | 1                      | 0                                               | 0                      |
| **Total**                                                                                                                         | **38**   | **28**                 | **7**                                           | **3**                  |

Resulting deltas locked in:

1. `Block.blockTypeIds[]` is an array reference (1+), not a single FK — coaches use composite block typing routinely (e.g. "STRENGTH ENDURANCE | Gymnastics").
2. `SchemeArchetypeKind` extended with `LADDER` and `DISTANCE` archetypes (delta over the 6 currently shipped in `@repo/contracts/lms/_domain/scheme-archetype.schema.ts`).

Cross-block anchors (`before BAR DIPS complex`, `AFTER each GYMNASTICS round`) are deferred — these are 3 of 38 patterns and the coach's intent is preserved as inline notes in MVP. We add structured anchors when concrete UI demand for cross-block scheduling emerges.

### Round 6 — Coach platform UX shape (`agreed`)

The coach interacts with a plan at `/coach/plans/[planId]`. UX shape is fixed here because schema follows what the UI needs to render and mutate.

#### Header

- **Left:** back arrow (existing platform pattern); plan name + description below — both inline-editable, blur-saves silently (existing pattern).
- **Right:** one conditional action button that depends on plan status:

| Status     | Button label | Action on click                                                  |
| ---------- | ------------ | ---------------------------------------------------------------- |
| `DRAFT`    | Publish      | Status → `ACTIVE`. Plan becomes enroll-able.                     |
| `ACTIVE`   | Archive      | Status → `ARCHIVED`. Plan becomes read-only; no new enrollments. |
| `ARCHIVED` | Activate     | Status → `ACTIVE`. Plan re-opens for enrollment and edits.       |

No confirmation modal. Archive is freezing, not destruction; if the coach mis-clicks, the inverse action is one click away.

Read-only viewers (e.g. HEAD_COACH viewing a regular coach's plan) see the header but with edit affordances disabled.

#### Tabs: Schedule | Athletes

##### Schedule

Calendar week view. Top sub-header has navigation:

```
[<-- prev] [week N · MMM D - MMM D, YYYY] [next -->]   [Today] [date picker]
```

Week number is computed from start of year. Today button appears when not on the current week.

Below: 7 day rows, separated by `Divider`. Each row left:

- Day label `Mon 3` — today rendered with the `3` in a circle.
- Optional DayType badge if the day has one assigned.

Hover on a day row reveals on the right:

- `+` IconButton — adds an empty session, immediately editable.
- (Click on day label opens DayType picker — implementation detail.)

A PlanDay row in the database is created lazily — only on the first action (assigning a DayType or adding a session). Untouched days have no DB row.

Inside a day, each session row has:

- Expand/collapse chevron.
- Hover-revealed: `+` (add block), basket (delete session).

The same hover-revealed-actions pattern cascades through Block → Item levels. The exact UX of editing prescriptions, picking BlockTypes / SchemeTypes / Exercises, filling scheme params, etc. is implementation-time detail — out of scope for this design doc.

Reordering sessions within a day, blocks within a session, items within a block: manual `order` edits in MVP, no drag-and-drop. Drag-and-drop is added once we observe coach friction with manual reordering.

##### Athletes

| State          | View                                                                               |
| -------------- | ---------------------------------------------------------------------------------- |
| 0 enrollments  | "No athletes enrolled yet" placeholder + `Enroll athlete` button                   |
| ≥1 enrollments | Card grid (matching `/coach/athletes` card pattern), each card with an action menu |

Card action menu:

- Conditional first item: `Pause` (if status `ACTIVE`) or `Resume` (if status `PAUSED`).
- `Remove` — soft-deletes the enrollment, athlete loses access; their snapshots stay attached to them.

`Enroll athlete` opens a modal with a searchable list of athletes available to the coach:

- Regular `COACH` sees only athletes assigned to them via `CoachAthleteAssignment`.
- `HEAD_COACH` sees all athletes; assignment is created implicitly during enroll.

Coach picks athlete + sets `boardedAt` (defaults to today, user can change).

### Round 4 — Completion snapshot (`agreed`)

#### Snapshot scope

The snapshot is a **fully denormalized prescribed tree**, captured at `started`. It is self-sufficient for both render ("what should I do") and logging ("what I did"). Library FKs are not preserved at the block / scheme / day-type level — display works from the resolved names already in the snapshot, and analytics will match by name + `primaryMovement` rather than by FK.

The one exception is `exerciseId`, which **is** preserved in `ExerciseLog.exerciseSnapshot`: cheap to store now, expensive to retrofit if cross-athlete exercise aggregation analytics arrives later.

| Level            | Snapshot contents                                                                           | Library FK kept                                        |
| ---------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `WorkoutSession` | scheduledDate, sessionLabel?, athleteId                                                     | planSessionId? (nullable; null if source plan deleted) |
| `BlockSession`   | order, resolved blockName, schemeName, schemeArchetypeKind, schemeParams (json), modifiers? | none                                                   |
| `ExerciseLog`    | order, resolved exerciseName, exerciseUrls[], primaryMovement, prescription                 | exerciseId (for future analytics)                      |
| `SetLog`         | order, prescribed (resolved), actual, completedAt?                                          | none                                                   |

#### Percent-of-benchmark resolution

Borrowed from the HWPO / TrainHeroic / Volt pattern, in MVP from day one.

A coach may prescribe a load using `loadSpec.kind = PERCENT_BENCHMARK` (an existing variant in the contracts), specifying a benchmark kind (e.g. `BACK_SQUAT_1RM`) and a percent. At session `started`:

1. For each item with a percent-prescribed load, the backend looks up the athlete's `PersonalRecord` for that benchmark kind.
2. If the PR exists, the resolved kg is computed and stored alongside the original percent in the snapshot's prescribed load.
3. If the PR does not exist, the snapshot stores the percent with a null resolved kg. The athlete sees the percent during the workout; pre-session UI prominently CTAs the athlete to set their PR in profile.

Updates to the athlete's PR after `started` do **not** retroactively reshape the in-flight snapshot — frozen is frozen. They affect subsequent sessions only.

No new tables: existing `PersonalRecord` plus the existing `PERCENT_BENCHMARK` `loadSpec` variant cover the entire flow.

#### Started — the operation

```
input: athleteId, planSessionId
checks:
  - athlete has an active (non-deleted) enrollment for the plan that owns this planSession,
    and the plan-session date is within the visibility window for that athlete
read:
  - full PlanSession tree, joined with BlockType / SchemeType / Exercise / PersonalRecord
transaction:
  - insert WorkoutSession { athleteId, planSessionId, scheduledDate, startedAt: now }
  - for each block: insert BlockSession with denormalized snapshot
  - for each item: insert ExerciseLog with resolved exercise snapshot + resolved prescription
  - SetLogs created lazily as the athlete logs each set
return: created snapshot tree
```

There is **no concurrency check** in MVP (no "one active session per day" lock). The athlete may start a parallel session if they want — observed risk is low and the constraint is not worth the cost at this stage.

#### Completed — the operation

`completedAt = now` plus optional summary fields (perceivedExertion, mood, notes). No analytics recompute happens in this call — analytics is derived live from snapshot tables when queried.

Late-close (athlete returns hours or days later to mark an abandoned session done): `completedAt = startedAt + 1h` — a deterministic placeholder duration rather than a fabricated real duration. We accept lossy timing for UX simplicity.

#### Analytics primitives in MVP

- **Scheduled session count (window)** — count of (athlete, planSession) pairs where the planSession date ∈ window and the athlete had an active enrollment on that date.
- **Completed session count (window)** — count of WorkoutSession with `completedAt` ∈ window.
- **Completion %** = completed / scheduled in the same window.
- **Streak** — current consecutive count of dates (going back from today) where the athlete had ≥1 completed session **or** had no scheduled session that day. Rest days do not break the streak; days outside the athlete's enrollment also do not break the streak. Only a date with a scheduled session and zero completed sessions breaks the chain.
- **Abandon rate (window)** — abandoned / started, over the same window.

**Tonnage analytics is explicitly out of MVP scope.** It returns when there is a real coach use-case for "this athlete's pull volume this month".

#### Materialization

Analytics in MVP is **derived live** from snapshot tables — no materialized weekly aggregates, no background recompute jobs. The existing `WeeklyVolume` table stays unused. With proper indices on `WorkoutSession (athleteId, completedAt)` and `WorkoutSession (athleteId, scheduledDate)` this stays cheap at MVP scale; we materialize later if we hit perf walls.
