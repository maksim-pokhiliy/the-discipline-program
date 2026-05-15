# Step 2 — Prisma Schema Port + Archetype Seed

> Self-contained prompt for execution by a fresh Opus 4.7 (1M context), max-effort session.

## Who you are

You are the executor for Step 2 of a multi-step workflow that integrates a training-domain model into the `the-discipline-program` monorepo. You are NOT the planner. The planner is in a separate session; the user shuttles prompts and outputs between you.

Today is **2026-05-12**.

## Why this step exists

This is the **fourth** attempt to ship training-session programming in this codebase. The previous three failed because of weak domain design and rushing. The previous code has been deleted. You will NOT search git history for traces of prior implementations. Memory entries about prior attempts have been deliberately cleaned up by the user before this step started — if you somehow encounter a trace of "SchemeType / SETS_REPS as 9th archetype / per-block atomic save / coach always edit mode / plan-editor rollback" anywhere, **STOP**, surface to the user.

Step 1 closed: the training-domain spec lives in `analysis/artifacts/06-formalization/schema.prisma` (anchor) and is ratified per D1-D4 (see below). Step 2 ports that ratified spec into the real `packages/api-server/prisma/schema.prisma` and seeds 34 canonical archetypes.

## Workflow rules (hard constraints)

1. **Allowed-to-modify** (and only these):
   - `packages/api-server/prisma/schema.prisma` (extend, do not rewrite existing models — append training-domain enums/models in a clearly delimited section)
   - `packages/api-server/prisma/seed.ts` (add call to new seeder)
   - `packages/api-server/prisma/seed/archetypes.ts` (NEW file)
   - Existing seed files in `packages/api-server/prisma/seed/` — **only if** the schema change breaks them; do not preemptively refactor
   - `implementation/step-02/output.md` (NEW, your final report)
2. **Do not modify**:
   - `analysis/**` — Step 1 closed; do not touch any analysis-artifact unless model-gap escalation forces an update (per workflow rules — and then STOP and escalate first, do not silently change)
   - `apps/**` — out of scope
   - Any other `packages/*/` outside `api-server` — out of scope
   - `.gitignore`, CI configs, lock files
3. **Existing schema must keep working**: existing `User`, `CoachProfile`, `AthleteProfile`, `TrainingPlan`, `PlanEnrollment`, `CoachAthleteAssignment`, billing, marketing models must continue to compile and seed. Your additions must be purely additive — three back-relations on existing `User` and `TrainingPlan` are the only edits to existing models.
4. **No `--no-verify`, `--no-edit`, `--no-gpg-sign`** in any git operations (if you make commits at all — `/feature` skill handles commit timing).
5. **No co-authored-by, generated-by signatures** anywhere.
6. **No comments inside code** unless they encode a non-obvious _why_ (single line max). Schema-DSL section markers (e.g., `// === Training-domain (Phase 7, 2026-05-12) ===`) are deliberate and welcome.
7. **Russian for chat-prose with the user, English inside files.**
8. **Question protocol**: if you must ask, **state your hypothesis with the question**. Do not ask without a hypothesis.
9. **Do not fabricate.** If `implementation-notes.md` does not specify some archetype's `archetypeParamsSchema` cleanly, escalate; do not invent.

## Use `/feature small`

Invoke `/feature small` skill for this step. Use a free-text selector pointing at this prompt:

> `/feature small Port training-domain schema from analysis/artifacts/06-formalization/ into packages/api-server/prisma/schema.prisma per implementation/step-02/prompt.md; seed 34 canonical archetypes; run db:reset.`

The `/feature small` pipeline (Research → Plan → Implement → Verify → Finalize) takes over from there. `.feature-dev/<ts>/` artifacts will be created; reference that path in `output.md`.

## Ratified decisions (recap — apply faithfully)

### D1 — Calendar Week as entity

- `Week { id, planId String (FK TrainingPlan.id), startDate DateTime @db.Date, notes String?, createdAt, updatedAt }` with `@@unique([planId, startDate])` and `@@index([planId, startDate])`. Cascade delete from plan.
- `Day { id, weekId String (FK Week.id), dayOfWeek DayOfWeek, labelId String?, notes String?, createdAt, updatedAt }` — no `order` field. Cascade delete from week. `@@unique([weekId, dayOfWeek])`, `@@index([weekId, dayOfWeek])`, `@@index([labelId])`.
- New enum `DayOfWeek { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY }`.

### D2 — Athlete = User + AthleteProfile, no `profileAttributes`

- Standalone `Athlete` model does NOT exist.
- `OneRMRecord.userId String` → FK on real `User.id`; relation `user User @relation(...)`. `@@unique([userId, exerciseId])`.
- `PerformedSession.userId String` → FK on real `User.id`; relation `user User @relation(...)`. `@@unique([sessionId, userId])`.

### D3 — Full-scope port at this step

Port ALL ratified entities into real schema even though athlete-flow UI is out of scope:

- Plan-content: `Week`, `Day`, `Session`, `Block`, `BlockLabelAssignment`, `Schema`, `SchemaPairing`, `SchemaRow`
- Catalog: `Exercise`, `Label`, `Archetype`
- Athlete-facing: `OneRMRecord`, `PerformedSession`, `PerformedExerciseInstance`

### D4 — Library vs Configuration

- `Exercise` and `Label` are **libraries**: NO seed. Coach populates via admin UI later.
- `Archetype` is **configuration**: mandatory full seed of 34 canonical entries this step. No admin CRUD.

### Additional ratifications (Step 1/2 micro-decisions)

- **Sparse order** (10/20/30) — used by `Session.order`, `Block.order`, `BlockLabelAssignment.order`, `Schema.order`, `SchemaRow.order`. Step 2 seed scope is mostly catalog (no order content) but use sparse if any seed creates Sessions/Blocks/etc.
- **`@@map` naming**: `training_*` snake_case prefix for every new training-domain model:
  - `Week → "training_weeks"`
  - `Day → "training_days"`
  - `Session → "training_sessions"`
  - `Block → "training_blocks"`
  - `BlockLabelAssignment → "training_block_label_assignments"`
  - `Schema → "training_schemas"`
  - `SchemaPairing → "training_schema_pairings"`
  - `SchemaRow → "training_schema_rows"`
  - `Exercise → "training_exercises"`
  - `Label → "training_labels"`
  - `Archetype → "training_archetypes"`
  - `OneRMRecord → "training_one_rm_records"`
  - `PerformedSession → "training_performed_sessions"`
  - `PerformedExerciseInstance → "training_performed_exercise_instances"`
- **`OneRMRecord.valueKg`**: `Decimal @db.Decimal(6, 2)` (room for up to 9999.99 kg; theoretical only).
- **`Exercise.canonicalName` / `Exercise.canonicalNameLower`** — port both fields as-is from analysis-schema. Lowercase variant maintained at app layer (later). Do NOT silently swap to `citext` even though Postgres extension is enabled — this is a refactor for a separate step.
- **`Label.name` / `Label.nameLower`** — same pattern. Port as-is.

## Inputs to read (before any edit)

1. `analysis/artifacts/06-formalization/schema.prisma` (anchor; 412 lines; ratified spec)
2. `analysis/artifacts/06-formalization/implementation-notes.md` — sections to mine:
   - §0 Phase 7 Integration Ratifications (D1-D4 in context)
   - Archetype catalog (full 34 with `archetypeParamsSchema` shapes per archetype). If a section explicitly lists archetypes with their param shapes — that is your source for `seed/archetypes.ts`. If a section is incomplete or descriptive-only — escalate before guessing.
3. `analysis/artifacts/06-formalization/types.ts` — for reference on JSON shapes (Intensity, Load, RepNotation, Tempo, etc.); you don't need to modify it
4. `packages/api-server/prisma/schema.prisma` — existing schema; learn naming convention (`lms_*`, `app_*`, `marketing_*`, `@db.Decimal(5,2)`, `previewFeatures = ["postgresqlExtensions"]`, `extensions = [citext]`); identify existing `User` and `TrainingPlan` to attach back-relations
5. `packages/api-server/prisma/seed.ts` — existing main seed entry; learn order of seeders, how `clearAll` works, how the file structure goes
6. `packages/api-server/prisma/seed/` (whole directory) — learn the per-entity seeder pattern (one file per area; exported function; imported in `seed.ts`)
7. `implementation/PLANNING_STATE.md` — for D1-D4 + sparse order semantics + step queue context
8. `CLAUDE.md` (project root) — for project-wide conventions (pnpm, Turbo, db-scripts filter pattern, etc.)

## Tasks

### Task 1 — Read inputs above. Build the mental map first

Before touching schema, you should be able to answer:

- Which existing relation field names on `User` might collide with `oneRMRecords` / `performedSessions` (likely none, but verify)
- Which existing relation field names on `TrainingPlan` might collide with `weeks` (likely none, but verify)
- The exact 34 archetype names with their `archetypeParamsSchema` JSON shape — extracted from `implementation-notes.md`
- The `seed.ts` orchestration order so you place `seedArchetypes(prisma)` appropriately (likely after `seedUsers` since archetypes have no FK dependencies)

If you cannot find a clean source for any archetype's `archetypeParamsSchema` — **STOP**, surface in output.md "Возникшие вопросы".

### Task 2 — Extend `packages/api-server/prisma/schema.prisma`

Append a clearly delimited training-domain section at the end of the file:

```prisma
// === Training-domain (Phase 7 ratification, 2026-05-12) ===
// Source spec: analysis/artifacts/06-formalization/schema.prisma
// Ratified per D1-D4 — see implementation/PLANNING_STATE.md

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

// ... 10 more enums copied from analysis-schema.prisma (Equipment, MovementType, CanonicalCompoundType, SchemaKind, RowKind, ArchetypeFamily, Position, OneRMRecordSource, SchemaPairingRelation, AppLevel)

model Week {
  id        String   @id @default(cuid())
  planId    String
  startDate DateTime @db.Date
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  plan TrainingPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  days Day[]

  @@unique([planId, startDate])
  @@index([planId, startDate])
  @@map("training_weeks")
}

// ... 13 more models per analysis-schema, with @@map("training_*") on each
```

Edit existing `model User`:

- Add lines (preserve all existing fields and relations):
  ```prisma
  oneRMRecords      OneRMRecord[]
  performedSessions PerformedSession[]
  ```

Edit existing `model TrainingPlan`:

- Add line (preserve all existing fields and relations):
  ```prisma
  weeks Week[]
  ```

**Note**: the analysis-schema has stub `model User` and `model TrainingPlan` at the bottom. These stubs are NOT ported — use the real existing models in app-level schema instead.

**Naming details that must match analysis-schema exactly** (don't paraphrase):

- enum members (e.g., Equipment values including `BOX_OR_SOFA`, `MIXED`, `UNKNOWN`)
- model field names (camelCase) — e.g., `canonicalCompoundType`, `archetypeParamsSchema`, `freezeLoadsAtCreation`, `relationKind`, `compoundRep`, `stageActuals`
- `Decimal` precision adjustment: change `valueKg Decimal` in analysis-schema to `valueKg Decimal @db.Decimal(6, 2)` in real schema (per micro-Q2 ratification)
- `@@unique` and `@@index` clauses preserved verbatim
- `onDelete` policies preserved verbatim

**Verification within this task**:

- Run `pnpm --filter @repo/api-server exec prisma format`. Schema should format without errors. Whitespace adjustments from the formatter are acceptable; accept formatter output.
- Run `pnpm --filter @repo/api-server exec prisma validate`. Schema should validate (no missing FKs, no duplicate names, no orphan back-relations).
- Do NOT run `prisma generate` yet — that comes in Task 4.

### Task 3 — Create `packages/api-server/prisma/seed/archetypes.ts`

This file exports `async function seedArchetypes(prisma: PrismaClient): Promise<void>` (or matching signature with existing seed files — check pattern).

Body: `prisma.archetype.createMany({ data: [ ...34 entries... ] })`.

Each entry MUST have:

- `name: string` — kebab-case canonical name (e.g., `"n-rounds"`, `"ladder-descending"`, `"emom-nested-per-minute"`, `"super-set"`)
- `kind: SchemaKind` — one of ATOMIC / HEADERLESS / NESTED / NAMED / COMPOSITE per analysis
- `family: ArchetypeFamily` — one of 9 families
- `headerPatternDescription: string` — description from implementation-notes.md
- `bodyLayoutDescription: string` — description from implementation-notes.md
- `archetypeParamsSchema: object` — JSON shape spec for the params; structure varies per archetype
- `relatedArchetypes: object` — JSON; references to related archetypes (specialization_of / paired_with / etc.) per implementation-notes.md

**34 archetypes (canonical list — verify against implementation-notes.md as your source of truth)**:

Rounds/Sets: `n-rounds`, `alternating-sets`, `super-set` (Phase 7)
Ladder: `ladder-descending`, `ladder-ascending`, `ladder-vertex-down-pyramid`, `ladder-spike`, `parallel-ladders-descending`, `parallel-ladders-mixed-direction`, `parallel-pyramids`
Time-cap: `amrap-flat`, `emom-nested-per-minute`, `emom-sub-minute-slot`, `time-window-outer`
Composite-rounds: `composite-rounds-with-rest`, `composite-intervals-then-rounds`, `composite-intervals-work-rest-fixed`, `composite-intervals-work-rest-progressive`, `composite-intervals-on-off-max-tail`, `composite-rolling-rounds`
Nested: `nested-rounds-over-rounds`, `nested-rounds-over-parallel-ladder`, `nested-composite-rounds-over-ladder`
Named: `named-themed-sets`, `named-exercise-program`
Single-line: `single-line-with-then-connector`, `single-line-bare`, `single-line-total-counter`
Flat/Parallel: `flat-list-headerless`, `pull-ups-dips-cycle`
Modality: `run-distance`, `placeholder-body`, `practice-list`, `url-only-body`

**Total: 34**.

If `implementation-notes.md` does not give you a complete `archetypeParamsSchema` for any archetype, **STOP**, surface that archetype name in `output.md` "Возникшие вопросы".

### Task 4 — Update `packages/api-server/prisma/seed.ts`

Add:

1. Import: `import { seedArchetypes } from "./seed/archetypes";`
2. Call: insert `await seedArchetypes(prisma);` at a sensible place in `main()`. Archetypes have no FK dependencies (Archetype.id is only referenced by Schema.archetypeId, which isn't seeded). Likely place: right after `await clearAll(prisma);` and before the user/profile seeders (any order works for archetypes; pick whatever reads cleanest).
3. Do NOT add seeds for Exercise or Label — per D4 they are libraries; admin UI will populate.
4. Do NOT modify existing seeders unless schema change broke them.

### Task 5 — Verify existing seed compatibility

The schema change adds new tables and adds back-relations on `User` and `TrainingPlan`. It should NOT break existing seed files:

- `seed/users.ts` creates User instances — back-relations are optional arrays, no impact
- `seed/training-plans.ts` creates TrainingPlan instances — back-relation `weeks` is optional, no impact
- Other seeders (blog, products, marketing, etc.) — untouched by schema change

Run a dry mental check before regen: do any existing seed files reference `User.athleteProfile` etc. in a way that breaks? No — we didn't change existing fields, only added new arrays.

If `pnpm --filter @repo/api-server exec prisma generate` errors out for a reason traced to existing seeds — escalate (likely schema validity issue from Task 2, not seed issue).

### Task 6 — Generate + reset DB

In order:

1. `pnpm --filter @repo/api-server exec prisma generate` — regenerates `@prisma/client` with new training-domain types (Week, Day, DayOfWeek, Session, Block, Schema, SchemaRow, Archetype, etc.). Existing references unbroken.
2. `pnpm --filter @repo/api-server db:reset` (per `feedback_discipline_db_non_prod.md`: discipline-program is dev Neon, ADR-0019, no versioned migrations during workflow). This drops + creates DB + applies schema + runs full seed.
3. Verify seed completed without errors (log says `Seed completed!`).
4. Verify table populations via a quick `prisma studio` poke or a one-shot script:
   - `training_archetypes` exactly 34 rows
   - `training_exercises` 0 rows
   - `training_labels` 0 rows
   - `training_weeks` / `training_days` / etc. 0 rows
   - `users` ≥ 2 (existing coach + athlete seeds)
   - `lms_training_plans` ≥ 1 (existing seed)

### Task 7 — Run pipeline verification

`/feature small` pipeline will already run type-check / lint / tests. Make sure:

- `pnpm check-types` passes (new types from `@prisma/client` should not have broken anything)
- `pnpm lint` passes
- `pnpm test` passes (or whatever the pipeline runs; do NOT skip)

If any failures trace to your changes, fix them. If failures are pre-existing flakiness unrelated to this step — document in output.md "Принятые решения", do not silently fix unrelated issues.

### Task 8 — Write `implementation/step-02/output.md`

Use this format (exact section headers):

```markdown
# Step 2 — Output

## Что сделано

<3-5 lines>

## Изменённые/созданные файлы

- <list>

## Принятые решения

<ambiguities resolved silently with rationale>

## Возникшие вопросы и как решены

<escalations or pending>

## Что отложено

<explicit defer markers>

## Ссылка на `.feature-dev/<ts>/`

<path from /feature small pipeline>

## Сценарий смоук-теста

N/A — Step 2 не затрагивает UI. Smoke-test для Step 2 = успешный `db:reset` + ручная проверка populations.

## Verification notes

- `prisma format`: <result>
- `prisma validate`: <result>
- `prisma generate`: <result>
- `db:reset`: <result>
- `pnpm check-types`: <result>
- `pnpm lint`: <result>
- `pnpm test`: <result>
- Table populations post-reset: <table → row count>

## Acceptance criteria self-check

- [ ] schema.prisma extended with training-domain section (14 models + 11 enums + 3 back-relation edits on existing User/TrainingPlan)
- [ ] All `@@map("training_*")` per spec
- [ ] OneRMRecord.valueKg has `@db.Decimal(6, 2)`
- [ ] No stub User / stub TrainingPlan ported (use existing)
- [ ] No Athlete model
- [ ] OneRMRecord.userId, PerformedSession.userId
- [ ] seed/archetypes.ts created with exactly 34 entries
- [ ] seed.ts updated to call seedArchetypes
- [ ] No Exercise / Label seed
- [ ] prisma format/validate/generate succeed
- [ ] db:reset succeeds
- [ ] Type-check / lint / tests green
- [ ] No changes outside packages/api-server/prisma/ and implementation/step-02/
```

## Hypothesis bank (apply silently, document in output.md)

- **Section placement in schema.prisma**: append training-domain section at end of file (after existing models). Order within section: enums first (alphabetical or grouped); then models in dependency order (Week, Day, Session, Block, BlockLabelAssignment, Schema, SchemaPairing, SchemaRow, Exercise, Label, Archetype, OneRMRecord, PerformedSession, PerformedExerciseInstance). Pure aesthetic choice — match the convention you see.
- **Comment style**: existing schema uses no comments inside models, only on enum or @@map lines occasionally. Match.
- **`createMany` vs `create`**: use `createMany` for archetype seed; faster and atomic.
- **Empty `Json` defaults**: if an archetype's `relatedArchetypes` is empty in the spec, store as `{}` not `null`; the field is non-null per analysis-schema.
- **Naming conflict with `Schema` model**: Prisma allows `model Schema` — no special action needed. `@@map("training_schemas")` keeps SQL clean.
- **Existing seeders' order**: do not reorder existing calls in `seed.ts`. Insert `seedArchetypes` as a new line; preserve everything else.

## Hard escalation triggers (STOP and surface in output.md + chat)

1. `implementation-notes.md` does not provide a clean `archetypeParamsSchema` for any specific archetype (you'd have to invent it).
2. Existing `User` or `TrainingPlan` already has a relation field colliding with `oneRMRecords` / `performedSessions` / `weeks`.
3. `prisma generate` fails for reasons not traceable to your schema edits.
4. `db:reset` fails for reasons not traceable to your changes (e.g., Neon dev creds missing — that's user's environment, not your bug).
5. `pnpm check-types` / `lint` / `test` reveals pre-existing failures unrelated to this step that would normally block. Document and ask.
6. You find a trace of prior training-domain implementation in code (e.g., a stray file in apps/platform/ or apps/admin/ that references training entities). The user expected this is cleaned up; surface immediately.
7. An archetype's spec implies a model-gap (e.g., a field on Schema or SchemaRow that doesn't exist) — model ratification needed; that's a Step planner decision, not yours.

## Order of operations (recommended)

1. Read all inputs (Task 1).
2. Extract 34 archetypes from `implementation-notes.md` into a working table (or just outline in your head). Confirm all 34 have clean `archetypeParamsSchema` data — escalate if not.
3. Edit `packages/api-server/prisma/schema.prisma` (Task 2).
4. `prisma format` + `prisma validate` — schema sanity.
5. Create `seed/archetypes.ts` (Task 3).
6. Update `seed.ts` (Task 4).
7. `prisma generate` (regenerate client).
8. `db:reset` (Task 6).
9. Pipeline verification (Task 7 — handled by `/feature small`).
10. Write `output.md` (Task 8).

## Final reminder

Be precise. Read fully before editing. Surface hesitations with hypotheses. Stop on hard triggers. The user has burned three attempts; this step is the foundation of everything that follows (Steps 3-12 build admin CRUD, platform editor on top of this schema). A clean Step 2 lets the rest of the workflow proceed at speed. Take the time to get archetype params right.

Good luck.
