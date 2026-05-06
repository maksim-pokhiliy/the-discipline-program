# 0038. Training plan domain

- **Status:** Accepted
- **Date:** 2026-05-05
- **Tags:** `lms`, `domain`, `schema`, `coach-platform`

## Context

ADR-0037 rolled the prior training-plan vertical back to a "not started" baseline on 2026-05-03. The surviving surface is a flat `TrainingPlan` CRUD shell plus a disconnected athlete-log snapshot tier (`WorkoutSession → BlockSession → ExerciseLog → SetLog`). The coach has no way to author plan content; the athlete has nothing to log against.

The product is now rebuilding the domain. Rather than replay the prior model, the rebuild starts from a clean conceptual frame negotiated with the product owner / domain expert, captured in `docs/design/training-plan-domain.md`. The reference for what a real coach actually programs is a 33-week home-equipment plan from a working CrossFit coach — 38 distinct abstract patterns enumerated and validated against the model before this ADR was written. This ADR freezes the high-level shape so the implementation work has a stable target. Two companion ADRs (0039 library-catalog, 0040 snapshot-and-analytics) lock the parts that are heavy enough to deserve their own records.

The single hardest constraint is metaphor fidelity. The coach views a plan as **a rail through time**: it has no inherent start or end; the coach lays sleepers forward (and backward when convenient); athletes board as passengers and ride forward; the rail's shape is independent of how many passengers ride. The prior ADRs (0027 onward) modeled plans as bounded artefacts with weeks-as-rows — a convention industry borrows from periodization software (TrainHeroic, Wodify). That convention conflicts with the rail metaphor: it forces a `Week` entity, a fixed cycle length, and a notion of "the plan starts here, ends there" that does not match how this coach works. The rebuild model rejects that convention.

## Decision

The training-plan domain is built around four orthogonal abstractions ("masses" in the design doc):

1. **Plan-as-rail** — a `TrainingPlan` is a named timeline of training days owned by one creator coach, with no inherent start or end and no week entity. Time is the primary axis; week-grouping is a UI concern derived from dates, not a domain primitive.

2. **Library** — plan content is assembled from a global open-ended catalog of named primitives (exercises, block types, scheme types, day types) that lives in the admin app. ADR-0039 specifies the catalog in detail.

3. **Passengers** — athletes board a plan via `PlanEnrollment`; multiple boardings never alter the plan's shape; the mental categories "individual / split / group programming" live only in the coach's head, never in domain types.

4. **Completion snapshot** — when an athlete starts a session, a frozen JSON snapshot of the prescribed tree is captured; analytics reads only from snapshots, never from the live plan tree. Plan content remains freely mutable forever. ADR-0040 specifies snapshot mechanics and analytics.

The plan content tree is four levels deep, each level expressing one concept that does not collapse cleanly into its neighbors:

```
TrainingPlan ── PlanDay ── PlanSession ── PlanBlock ── PlanItem
                  │            │             │             │
                  │            │             │             └─ Exercise (library) + prescription
                  │            │             └─ BlockType[] (library) + SchemeType (library) + scheme params
                  │            └─ ordered training event ("morning yoga", "afternoon weightlifting")
                  └─ a single calendar date; optionally typed via DayType (library); lazy-created
```

- **`PlanDay`** is created lazily — only when the coach puts content on a date (assigns a `DayType` or adds a session). Untouched dates have no row. A rest day is therefore the absence of a row; UX may render the absence with a `DayType` label such as "Rest Day", but the code knows nothing about what the label means.
- **`PlanSession`** is the granularity at which an athlete clicks "start" and "complete". Multiple sessions per day are first-class; the schema does not assume one.
- **`PlanBlock`** carries 1+ `BlockType` references (composite block-typing is normal — coaches write "STRENGTH ENDURANCE | Gymnastics" as a single block), one `SchemeType`, scheme parameters, items, and modifiers.
- **`PlanItem`** is one exercise prescription: library exercise reference + reps + load + tempo + variation.

Lifecycle — `TrainingPlanStatus` survives unchanged from the prior implementation:

```
DRAFT ──► ACTIVE ──► ARCHIVED
```

`DRAFT` plans are not enrollable and only the creator can view content. `ACTIVE` accepts enrollments. `ARCHIVED` is read-only — no new enrollments, no content edits — but existing snapshots remain accessible because they belong to the athlete, not the plan. Archiving is freezing, not deletion; soft-delete (`deletedAt`) is orthogonal.

Plan content is **mutable in any state except `ARCHIVED`**, including past dates. There are no "freeze past days" rules and no edit warnings around historic content. This is safe because of mass 4 — the snapshot at `started` decouples the athlete's session from later coach edits.

Each athlete session has two events:

1. **`started`** — backend captures a frozen snapshot of the prescribed `Session → Block → Item` tree.
2. **`completed`** — `completedAt` is recorded; duration becomes derivable.

Abandoned sessions (`startedAt` set, `completedAt` null, plan-day date in the past) are derived state, not a status flag. The athlete may return later and mark such a session completed; backend records `completedAt = startedAt + 1h` rather than fabricating a real duration.

Permissions, single-tenant by design (the project is built for one brand — TDP):

| Role              | Admin app          | Coach platform                                            | Athlete app                                    |
| ----------------- | ------------------ | --------------------------------------------------------- | ---------------------------------------------- |
| `ADMIN`           | full               | —                                                         | —                                              |
| `HEAD_COACH`      | full (super-admin) | full + read regular coaches' plans + enroll into any plan | —                                              |
| `COACH` (regular) | —                  | own plans only (CRUD + enroll into own)                   | —                                              |
| `ATHLETE`         | —                  | —                                                         | view enrolled plans, log sessions, own profile |

The existing `verifyPlanOwnership` rule (creator OR `ADMIN/HEAD_COACH`) survives unchanged. Library entries are authored only in the admin app, so only `ADMIN` and `HEAD_COACH` can extend the catalog; regular `COACH` consumes.

`PlanEnrollment` carries an `EnrollmentStatus` discriminator with three values: `ACTIVE`, `PAUSED`, `REMOVED`. Pause/Resume is a status flip on the same row; Remove soft-deletes; re-enrollment after Remove creates a new row (two stints = two tickets, never merged at the domain level).

`HEAD_COACH` may enroll an athlete into any plan without a pre-existing `CoachAthleteAssignment`; the assignment is created implicitly during enrollment.

Athletes do not self-enroll in MVP. Future flow: marketing site sells a product = (platform access + access to a specific plan); purchase auto-creates the athlete account and the enrollment via a system user; `enrolledById` accommodates this without schema change.

Visibility (athlete-side product rule, not domain): the athlete sees the plan from the **Monday of the calendar week containing `boardedAt`** through **today + 30 days**. Sleepers further out are not yet visible. Coach-side is unbounded. The domain places no upper bound on the rail; the window is a query filter applied only on the athlete app.

Coach plan-detail UX shape (`/coach/plans/[planId]`) is fixed in this ADR because schema follows what the UI needs:

- Header: back arrow, inline-editable name + description (blur-saves silently), one conditional action button — `Publish` (DRAFT → ACTIVE), `Archive` (ACTIVE → ARCHIVED), `Activate` (ARCHIVED → ACTIVE), no confirmation modal.
- Tabs: `Schedule | Athletes`.
- `Schedule`: week view with prev/next/Today/date-picker navigation; 7 day rows; hover-revealed `+` per day spawns an editable session; cascade hover-revealed actions through Block → Item levels; reordering is manual `order` edits in MVP, no drag-and-drop.
- `Athletes`: empty-state placeholder + `Enroll athlete` CTA, or grid of athlete cards (matching `/coach/athletes`) with action menu (`Pause`/`Resume` conditional + `Remove`).

The decision is bounded to the LMS plan-authoring + enrollment surface. IAM, billing, marketing, CMS, storage, coaching dashboard, action items, and the existing athlete-log snapshot tier are not affected by this ADR (the snapshot tier is reused as-is by ADR-0040).

## Consequences

**Positive:**

- The rail metaphor is preserved end-to-end. No `Week` entity, no fixed cycle, no "plan start / plan end" dates. A coach who programs continuously for 33 weeks (the reference dataset) does not fight the model.
- The four-level decomposition is the minimum that captures the coach's real composition: `Day` for calendar position, `Session` for "one training event the athlete starts", `Block` for "one library-composed unit", `Item` for "one exercise prescription". Three levels lose either day-level multi-session capacity or block-as-library-unit. Five levels add a `Week` that the metaphor rejects.
- Lazy `PlanDay` creation makes the absence of training a first-class state without a flag. Rest day is the absence of a row; UX can decorate the absence with a `DayType` label ("Rest Day", "Active Recovery") without the code carrying any business rule about what a rest day means.
- Two-event session lifecycle (`started`, `completed`) yields four analytics primitives for free: duration, attempts vs completions, streak, abandon rate. Snapshot at `started` (not `completed`) decouples coach edits from in-flight sessions.
- The existing `creatorId` + role-bypass authorization rule continues to apply unchanged. Single-tenant scoping is honest; no fake multi-org abstractions to maintain.

**Negative:**

- The four-level tree means more tables to seed and to keep type-safe. Acceptable: the tree mirrors the coach's mental model 1:1 and the alternative collapses lose expressiveness.
- The athlete visibility window is expressed as a product query rule, not a domain rule. Anyone reading the database directly will see the entire forward rail; anyone querying through the athlete app will see ~5 weeks. This is a deliberate split — the rail is the truth, the window is a presentation concern — but it means there is no single source of truth for "what the athlete sees today" outside of the query layer.
- No drag-and-drop in MVP. Reordering is manual `order` edits. The cost is coach friction on long days; we accept it because the implementation cost of correct drag-and-drop reordering across nested levels is non-trivial and not yet justified.
- Live plan mutability with no audit log means coach edits to past days disappear silently. Snapshots protect athlete history; the coach's own edit trail is lost. Acceptable in MVP — the coach is one person operating in good faith; multi-coach edit conflicts are not a real scenario.

**Neutral:**

- The existing `TrainingPlan` model + `TrainingPlanStatus` enum + status-transition endpoints (`activate`, `archive`, `restore`, `delete`, CRUD) survive unchanged and are reused as-is. The new content tables hang off `TrainingPlan.id` without altering its shape.
- The existing snapshot tier (`WorkoutSession → BlockSession → ExerciseLog → SetLog`) survives unchanged. ADR-0040 specifies how the new plan tree feeds into it at session-start time.
- The existing `verifyPlanOwnership` guard, `PersonalRecord` model, and `_domain` Zod primitives (`schemeArchetypeKindSchema`, `loadSpecSchema`, `prescriptionSchema`, `exerciseSnapshotSchema`, `MovementPattern`, `PrKind`) are reused. No re-litigation of those decisions.
- `WeeklyVolume`, `Benchmark`, and `BenchmarkSource` models are removed — see the cleanup audit (`docs/design/cleanup-audit-2026-05-05.md`) for the full removal list. Tonnage analytics is explicitly out of MVP scope (ADR-0040); a separate benchmark-workout library is deferred (ADR-0039).
- The design negotiation that produced this ADR is preserved in `docs/design/training-plan-domain.md` — six rounds of detail, the PDF coverage check (38 patterns mapped), and the strong-opinion / counter-opinion exchanges that drove each decision.

## Alternatives considered

**Five-level tree with explicit `Week` entity.** Standard industry shape (TrainHeroic, Wodify, CompTrain). Makes "show me week 3" trivial; gives a place to attach week-level metadata (deload markers, phase tags). Rejected because it forces the rail metaphor through a periodization frame that does not match how the reference coach works — he programs sparse weeks (gaps without explanation), runs continuous timelines without phase boundaries, and never references a fixed cycle. Week-grouping is derivable from dates whenever UI needs it.

**Three-level tree (`Day → Block → Item`, no Session).** Smaller surface; fewer tables. Rejected because the coach explicitly described 2-a-days as "a session in the morning, a session in the afternoon" — distinct training events the athlete starts and completes separately. Collapsing sessions into "blocks tagged morning" loses the boundary at which the athlete clicks `start` / `complete` and forces the snapshot to capture a finer granularity than reality demands.

**Single closed `BlockCategory` enum instead of free-form library.** Lock the set of block roles ("STRENGTH_ENDURANCE", "PUMP", "GYMNASTICS", ...) into a code-controlled enum. Type safety; analytics-friendly. Rejected because (a) the coach explicitly said "block is an abstraction, the trainer builds from primitives", and (b) the PDF shows the coach inventing block names at will (`Basic GYMNASTICS`, `STRENGTH ENDURANCE | Gymnastics`, `STRENGTH ENDURANCE | EASY PACE`). A closed enum would either reject the coach's vocabulary or ossify into an ever-growing list.

**Plan versioning + immutable published snapshots.** TrainHeroic / industry default for "edit-without-rewriting-history" semantics. Rejected because the snapshot mechanism (mass 4) already solves the only problem versioning would solve — protecting completed sessions from later coach edits. Adding a `PlanVersion` entity on top would double the surface for zero analytics gain; the snapshot is the version, written once at `started`.

**Day-first UX (no calendar grid, just "next workout") for MVP.** Cheaper UX. Rejected because the design negotiation surfaced "I want to see the whole week" as the coach's actual planning view; the calendar grid is the natural surface even at MVP scope, and we already have day-row primitives.

## References

- `docs/design/training-plan-domain.md` — full design negotiation in six rounds, including the strong-opinion exchanges that drove each decision and the PDF coverage check.
- `docs/design/cleanup-audit-2026-05-05.md` — exhaustive list of dead artefacts removed in service of this build (already-clean code paths confirmed; positive removals enumerated).
- ADR-0019 — database strategy (drop+recreate sanctioned for non-prod; basis for the implementation rollout via `pnpm db:reset`).
- ADR-0032 — single-team / no-tenant simplification (still in force; this ADR continues that line for permissions).
- ADR-0036 — idempotency-key on mutations (continues to apply structurally to every mutation route in the new surface).
- ADR-0037 — prior plan-editor rollback (the baseline this ADR builds on).
- ADR-0039 — training-plan library catalog (specifies the four library entry types referenced from this ADR).
- ADR-0040 — training-plan snapshot and analytics (specifies the snapshot mechanics referenced from mass 4).
