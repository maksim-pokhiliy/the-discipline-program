# 0039. Training plan library catalog

- **Status:** Accepted
- **Date:** 2026-05-05
- **Tags:** `lms`, `library`, `admin`, `schema`

## Context

ADR-0038 establishes that plan content is assembled from a catalog of named primitives, not authored as free text. This record specifies the catalog: what entries exist, where they live, who manages them, how plan content references them, and how the references survive entry renames and deletions.

The prior implementation (ADR-0034) modeled three independent libraries (`Exercise`, `BlockKind`, `SchemeTemplate`) inside the platform app, each authored by coaches as a self-service operation. ADR-0037 deleted those libraries entirely. The rebuild changes both the placement and the scope:

- **Placement.** The library lives in the admin app, alongside ~half a dozen existing CRUD catalogs (blog posts, products, users, reviews, pages, contacts) following a single mature pattern (`/apps/admin/src/modules/<entity>/{views,sections,components}` + `createCrudHooks` + `withAdminAuth`). The platform app only consumes; regular coaches do not extend the catalog. This makes the library "just another admin table" rather than its own architectural concern.
- **Scope.** Four entry types — `Exercise`, `BlockType`, `SchemeType`, `DayType` — instead of three. The new `DayType` covers the UX need to label rest / active-recovery / themed days as a coach affordance without baking business rules into the code. `SchemeType` replaces the prior `SchemeTemplate` with a pared-down shape (no items snapshot, no preset reps).

The reference coach's PDF was used to validate that a small four-type catalog covers his vocabulary without forcing him to invent compound entries or accept lossy alternatives. 38 distinct abstract patterns were enumerated against the model in the design doc; the catalog plus the per-block parameter slots cover all but three (cross-block named anchors, deferred to a future enhancement).

## Decision

### Surface

The library lives entirely in the admin app (`apps/admin`). Each entry type is a standard CRUD entity following the existing admin pattern:

- Routes under `/apps/admin/src/app/(dashboard)/<entity>/{,create,[id]}/page.tsx`
- Module folder `/apps/admin/src/modules/<entity>/{views,sections,components}/`
- `DataTable` list view + `react-hook-form` create/edit (mirrors blog / products / users)
- Hooks built via `createCrudHooks()` from `@repo/query`
- API endpoints in `packages/api-server/src/endpoints/lms/library/<entity>/` wrapped with `withAdminAuth`
- Navigation entries grouped under a new "Library" section in `ADMIN_NAVIGATION`

`ADMIN` and `HEAD_COACH` may author and edit catalog entries (the latter has admin-app access as super-admin per ADR-0038). Regular `COACH` is a consumer in the platform app and never sees the catalog UI; references are picked from dropdowns. `ATHLETE` never interacts with the catalog at all.

### Catalog entries

Four entry types in MVP. All other "templates" — preset blocks with bundled items, week templates, session templates — are deferred. Presets that bundle multiple primitives are a Phase 2 ergonomic shortcut that depends on data the coach hasn't generated yet.

#### `Exercise`

```
{
  id, name,
  urls: string[],                  // 0..N video links, all equal in status
  primaryMovement: MovementPattern, // closed enum, required
  benchmarkPrKind: PrKind?         // optional FK to closed PrKind enum
}
```

`primaryMovement` is required because it is the only analytics axis the catalog provides (per-pattern rollups, future imbalance reporting). Other facets — `modality`, `bodyParts`, `defaultMetrics` — are deferred. Adding them ahead of a concrete UI need is over-modeling.

`benchmarkPrKind` is set when the exercise has a tracked PR (e.g. `Back Squat` → `BACK_SQUAT_1RM`). Items prescribing `loadSpec.kind = PERCENT_BENCHMARK` only accept exercises whose `benchmarkPrKind` is non-null; the percent resolves at session-start against the athlete's `PersonalRecord` for that kind (see ADR-0040).

`PrKind` is a closed enum. Adding a kind is a code PR, not a self-service admin operation. The trade-off keeps type safety: snapshots and analytics know exactly what kinds exist.

A separate `Benchmark` library entity for named composite workouts (Fran, Murph) — where the PR is best workout time — is **deferred entirely**. The reference coach's vocabulary uses per-exercise percent benchmarks (`Back Squat 1RM`, `Deadlift 1RM`) but never per-workout-time benchmarks (`% of your Fran time`). When that prescription pattern emerges, we add a separate library entity for it then.

#### `BlockType`

```
{ id, name, description? }
```

A label for a block role: `STRENGTH ENDURANCE`, `PUMP SESSION`, `WARM UP`, `GYMNASTICS`, `SUCCESSORY WORK`, `CORE MUSCLES`, etc. No suggested-schemes, no color, no metadata. Pure label.

The pared-down shape is intentional. The PDF shows the coach's BlockType vocabulary mutating freely (`Basic GYMNASTICS` vs `GYMNASTICS` vs `STRENGTH ENDURANCE | Gymnastics`); locking semantics into BlockType columns would force the coach to adapt his vocabulary to the schema. The label is the value; everything else lives at the block-instance level.

A `PlanBlock` carries **1..N** `BlockType` references (composite block-typing is normal in the PDF — coaches write `STRENGTH ENDURANCE | Gymnastics` as a single block). The relation is many-to-many through a join table.

#### `SchemeType`

```
{ id, name, archetypeKind: SchemeArchetypeKind, defaultParams?: Json }
```

Library entries are **abstract scheme templates**: `EMOM`, `AMRAP`, `Sets×Reps`, `Rep Ladder`, `RFT`, `Chipper`, `For Time`, `Run Distance`. Concrete instances (`EMOM 12 min`, `21-15-9`, `EMOM 20 / 4-min pattern × 5`) are not separate entries; they are produced by filling parameters at use-time on the block.

`SchemeArchetypeKind` is a **closed enum** of technical primitives that drive UI rendering and parameter-shape validation. Adding a new archetype is a code PR. After PDF pattern validation, the MVP archetype set is:

| Archetype       | Covers                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------ |
| `NONE`          | sets×reps, plain composition, accessory list                                               |
| `COUNT_UP`      | AMRAP / RFT / Chipper / For Time / Density (target = rounds/reps; capped or uncapped time) |
| `COUNT_DOWN`    | descending for-time variants                                                               |
| `LADDER`        | rep ladders — asc / desc / pyramid (params: `{ sequence: number[], direction }`)           |
| `EMOM_LOOP`     | every-minute on the minute, with REST as a valid slot, slot ranges allowed                 |
| `INTERVAL_LOOP` | work/rest cycles ("5x 2 min ON \| 2 min OFF")                                              |
| `TIME_BOXED`    | time-windowed segments, skill practice                                                     |
| `DISTANCE`      | running prescriptions ("RUN 5 km", "RUN 5-7 km")                                           |

This is the existing six (`NONE / COUNT_UP / COUNT_DOWN / INTERVAL_LOOP / EMOM_LOOP / TIME_BOXED`) plus two new variants (`LADDER`, `DISTANCE`). The two-archetype delta is added to `schemeArchetypeKindSchema` in `@repo/contracts/lms/_domain/scheme-archetype.schema.ts` as part of the build, not as a follow-up.

Within-block phases ("...then..." part 2) are handled by splitting into two sequential blocks in the same session, not by phases inside a single scheme. This keeps `schemeParams` clean and reuses the block-as-composition-unit boundary.

#### `DayType`

```
{ id, name, color: string }
```

A dumb label. The code knows nothing about what `Rest Day`, `Active Recovery`, or `Legs Day` means semantically. The coach may attach a `DayType` to a `PlanDay` with zero sessions (the typical "rest" case), one session, or many sessions; both the schema and the application logic accept all combinations.

`color` is included in MVP because the calendar grid benefits from visual differentiation. The format (hex string vs MUI palette key) is an implementation choice; the design only requires that the slot exists.

### Reference semantics

Library entries are referenced from plan content **by FK, as live links**. When an admin renames `PUMP SESSION` to `HYPERTROPHY SESSION`, every plan that references that `BlockType` immediately reflects the new name in coach UI. No copy-on-insert; no version history.

This is safe because of ADR-0040: at the moment an athlete starts a session, the snapshot freezes the displayed names of the entries in use. Past completions are not affected by future library renames. Coaches see live names; athletes see frozen names; the two never collide.

### Soft-delete

All four entry types support `deletedAt` soft-delete. Soft-deleted entries:

- remain readable for snapshots and any historical UI;
- are filtered out of "create new block / pick exercise" pickers;
- show as `(deleted)` in plan trees that still reference them, until the coach replaces the reference.

Hard-delete is blocked by the application if the entry is referenced anywhere in active plan content. Soft-delete is always allowed.

### Naming and uniqueness

Each entry type enforces case-insensitive name uniqueness at the database level. The ID is the canonical identity; name is human display. Two `BlockType` rows with names `PUMP SESSION` and `Pump Session` cannot coexist; one will fail at insert.

There is no admin moderation, no draft state, no promotion to "blessed". If catalog rot becomes a real problem (duplicate variants, abandoned entries), admin tooling is added then — not pre-empted now.

## Consequences

**Positive:**

- The library inherits a mature CRUD pattern from six existing admin entities. No new architectural surface; no new conventions to learn. A new contributor recognizes the shape immediately.
- Splitting authoring (admin) from consumption (platform) protects regular coaches from accidentally polluting the catalog and matches the actual social structure of the project (one head coach, many regular coaches operating off a curated catalog).
- Live FK references with snapshot-on-start give the right behavior on both edges: coaches see updated catalog data instantly, athletes' history stays frozen at the moment they began the session.
- The four-entry catalog is small enough to seed completely from the reference coach's PDF in one pass — every recurring `BlockType`, every `SchemeType` family, the full warm-up + accessory + chassis-of-the-week exercises — without leaving the model under-specified.
- `Exercise.benchmarkPrKind` collapses what would otherwise be two parallel libraries (Exercise + Benchmark) into one entity with an optional facet. Coach picks `Back Squat`; UI offers "use percent" because `benchmarkPrKind` is set; resolution is automatic.

**Negative:**

- Coaches cannot extend the library themselves in MVP. If a regular coach wants `STRENGTH ENDURANCE` and the catalog only has `STRENGTH-ENDURANCE`, they cannot self-correct — they ping the head coach. This is acceptable in a single-org with one or two coaches; it does not scale to a marketplace.
- A two-archetype delta in `SchemeArchetypeKind` is a breaking change to the existing enum. Drop+recreate via `pnpm db:reset` per ADR-0019; no migration. The cost is bounded because no production data exists, but it tightens the coupling between the contracts package and the database schema.
- Soft-deleted entries remain readable for snapshots, which means they are also indirectly readable through plan-detail UI when a coach views a plan that still references them. The `(deleted)` decoration is a workaround; the cleaner answer is a "replace this reference" flow, which we defer.
- Composite block-typing through a join table means querying "all blocks of type X" requires a join through the pivot. Acceptable at MVP scale; a denormalized projection can be added if analytics demands it.

**Neutral:**

- `PrKind` is a closed enum. Adding a new PR kind (e.g. `BENCH_PRESS_1RM`) is a code PR. The contract is "library content is open, type primitives are closed" — exactly the inversion of typical CRUD libraries, and exactly what protects analytics.
- The library lives in the admin app's database tables but the contracts (Zod schemas + types) live in `@repo/contracts/lms/library/<entity>/`, alongside the existing plan-and-snapshot contracts. Both apps consume.
- The existing `@repo/contracts/lms/_domain/` primitives (`exerciseSnapshotSchema`, `loadSpecSchema`, `prescriptionSchema`, `tempoSpec`, `repSpec`, `sideMode`, `modality`, `bodyParts`, `movementPattern`, `prKind`, `rxStatus`, `schemeArchetypeKind`, `workoutSessionStatus`, `benchmarkSource`) survive unchanged except for the `LADDER` + `DISTANCE` archetype additions. They are reused by both library entries (`Exercise.primaryMovement`, `Exercise.benchmarkPrKind`) and snapshot writers (`exerciseSnapshot`, `prescription`).
- No `LibraryScope` enum, no per-coach catalog scoping. Single global catalog. If multi-org ever lands, a `tenantId` column is the place to start, but the schema does not pre-empt it.

## Alternatives considered

**Per-coach catalogs (each coach has their own library, with optional sharing).** Industry default in coaching SaaS (TrueCoach, Trainerize). Rejected because the project is single-tenant and the head coach explicitly wants curated vocabulary across the team — per-coach drift is a problem he is trying to avoid, not enable.

**Combined `Block + Item` library with full preset bundling (TrainHeroic-style).** A `BlockTemplate` entry would carry a default scheme + a default item list (e.g. `Successory Shoulders 3 Sets` ships with `DB Halfkneeling Press / Lateral Raise / Rear Delt`). Rejected for MVP because the preset population requires data the coach hasn't generated yet — building the abstraction before the data exists has burned previous attempts (ADR-0035). When the catalog has 100+ exercises and 30+ block types in active use, presets become valuable; right now they are speculation.

**Open `SchemeArchetypeKind` (admin-managed scheme archetypes alongside scheme types).** Maximum flexibility; admins could invent new scheme shapes. Rejected because every archetype needs UI render code and parameter-shape validation that lives in the application, not in data. A row that says "the new archetype is `WAVE_LOADING`" without code support produces an unrenderable block. Closed enum is the only honest contract.

**Dedicated `Benchmark` library for named workouts (Fran, Murph) from day one.** Future-proofing for percent-of-Fran-time prescriptions. Rejected per the reference coach's vocabulary — he uses per-exercise PRs exclusively. Adding a benchmark library now would create a second pickable type with no use cases, dragging admin UI load for zero gain. Defer until the prescription pattern actually appears.

**`DayType` with semantic flags (`isRest: bool`, `category: enum`).** Make rest day a real domain concept. Rejected because the moment the schema knows what `isRest` means, the application starts enforcing rules ("a rest day cannot have sessions") that constrain coach behavior. The dumb-label decision in ADR-0038 mass 1 is preserved here: `DayType` is presentation, not constraint.

## References

- `docs/design/training-plan-domain.md` — full design negotiation, especially Round 2 (Library) and the PDF coverage check.
- ADR-0034 — three independent CRUD libraries (superseded by ADR-0037; this ADR replaces with a different shape).
- ADR-0036 — idempotency-key on mutations (continues to apply structurally to library mutation routes).
- ADR-0037 — prior plan-editor + library rollback (the baseline this ADR builds on).
- ADR-0038 — high-level training-plan domain decisions (the rail metaphor and four masses; this ADR specifies the library mass).
- ADR-0040 — snapshot mechanics (referenced for live-link safety: snapshots freeze names so library renames do not affect history).
