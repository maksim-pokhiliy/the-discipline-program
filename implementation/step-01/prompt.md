# Step 1 — Model Ratification

> Self-contained prompt for execution by a fresh Opus 4.7 (1M context), max-effort session.

## Who you are

You are the executor for Step 1 of a multi-step workflow that integrates a training-domain model into the `the-discipline-program` monorepo. You are NOT the planner. The planner is in a separate session; the user shuttles prompts and outputs between you. Communicate succinctly.

Today is **2026-05-12**.

## Why this step exists

This is the **fourth** attempt to ship training-session programming in this codebase. The previous three failed because of weak domain design, rushing, lack of step-by-step planning. The previous code has been deleted. You will NOT search git history or memory for traces of prior implementations. If you accidentally find such traces in code or memory — **STOP**, surface to the user, await instructions.

The single legitimate source of the domain model is `analysis/artifacts/` (specifically `05-synthesis/` and `06-formalization/` — others are read-only history). It will stay so until ported into `packages/api-server/prisma/`.

This step is **documentation-only**: you update markdown files and one `.prisma` file inside `analysis/artifacts/`. **No code in `packages/api-server`. No code anywhere else.** This is not `/feature`; do not invoke that skill.

## Workflow rules (hard constraints)

1. **Read-only forever** (do not touch under any circumstance):
   - `analysis/source/`
   - `analysis/artifacts/00-meta/`
   - `analysis/artifacts/01-inventory/`
   - `analysis/artifacts/02-patterns/`
   - `analysis/artifacts/03-content/`
   - `analysis/artifacts/04-structure/`
2. **Writable in this step** (and only this step's allowed files):
   - `analysis/artifacts/05-synthesis/domain-model.md`
   - `analysis/artifacts/05-synthesis/er-diagram.md`
   - `analysis/artifacts/06-formalization/schema.prisma`
   - `analysis/artifacts/06-formalization/er-final.md`
   - `analysis/artifacts/06-formalization/implementation-notes.md`
   - `analysis/artifacts/06-formalization/types.ts`
   - `implementation/step-01/output.md` (your final report)
3. **Out of scope, do not touch**:
   - `analysis/artifacts/05-synthesis/stress-test.md`
   - `analysis/artifacts/05-synthesis/edge-cases.md`
   - `analysis/artifacts/06-formalization/stress-final.md`
   - **However**, if a ratification below breaks a documented stress test, **STOP and escalate** to the user (with a hypothesis of what to do). Do NOT modify stress files.
   - `packages/api-server/**`, `apps/**`, anything outside `analysis/` or `implementation/`.
4. **No code generation, no Prisma client generation, no DB push, no install, no build, no tests.** This step has zero runtime side effects.
5. **No `/feature`, no `/audit`, no other pipeline skills.** Plain edits.
6. **No co-authored-by / generated-by signatures.** No comments inside code unless they encode a non-obvious _why_; the few you write below are deliberate (schema-fragment markers).
7. **Russian for chat-prose with the user, English inside files.**
8. **Question protocol**: if you must ask, **state your hypothesis with the question** ("here is what surfaced; from a coach's perspective it probably means X; am I right or not?"). Do not ask without a hypothesis.
9. **Do not fabricate.** If you can't find something, say so. If your hypothesis is shaky, say so.

## Ratified decisions to apply (D1-D4)

These were ratified after two rounds of clarification with the user (a coach). Apply them faithfully across every artifact below.

### D1 — Calendar Week as entity

- A `Week` model lives between the existing `TrainingPlan` (in real `packages/api-server/prisma/schema.prisma`) and `Day` (in analysis-schema).
- `Week` is a **calendar slot** (Monday-Sunday ISO week), NOT a relative "week 1 of 12" of a fixed program. Plans run indefinitely (the user described plans as "trains" — they roll forward; coaches programme each upcoming calendar week; athletes enroll/leave at any time).
- Fields:
  - `id String @id @default(cuid())`
  - `planId String` — FK to `TrainingPlan.id` (TrainingPlan is in app-level schema; here represented as a stub model)
  - `startDate DateTime @db.Date` — Monday of the ISO week this `Week` represents
  - `notes String?` — coach-facing free text ("deload", "competition prep", "vacation skip")
  - `createdAt DateTime @default(now())`
  - `updatedAt DateTime @updatedAt`
- Constraints:
  - `@@unique([planId, startDate])` — one Week per plan per ISO-week
  - `@@index([planId, startDate])`
- Relations:
  - `plan TrainingPlan @relation(fields: [planId], references: [id], onDelete: Cascade)`
  - `days Day[]`
- **Day model changes**:
  - **Remove** `order Int`
  - **Add** `weekId String`
  - **Add** `dayOfWeek DayOfWeek` (new enum below)
  - **Keep** `labelId String?`, `notes String?`, `createdAt`, `updatedAt`
  - **Add** relation: `week Week @relation(fields: [weekId], references: [id], onDelete: Cascade)`
  - **Constraints**: `@@unique([weekId, dayOfWeek])` (one Day-entry per weekday per Week); `@@index([weekId, dayOfWeek])`; existing `@@index([labelId])` if present, keep
- **New enum**: `DayOfWeek { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY }`
- **Derived (not stored)**: week-end date, ISO year+week number, per-day calendar date. These belong in app layer.

### D2 — Athlete = User + AthleteProfile (no standalone `Athlete`, no `profileAttributes`)

- **Remove** the entire `model Athlete { ... }` block from `analysis/artifacts/06-formalization/schema.prisma`.
- `Athlete.profileAttributes` (Phase 6 placeholder for dual-value resolver, sex, level, RX-SC tier) is **dropped entirely**. It was always a placeholder. If future needs surface (e.g., level, modalityTier), they will be added as **explicit enum columns** on `AthleteProfile` in app-level schema, NOT as jsonb. Do not preserve the field in any form.
- **OneRMRecord changes**:
  - `athleteId String` → **rename to** `userId String`
  - Relation: `athlete Athlete @relation(...)` → **replace with** `user User @relation(fields: [userId], references: [id], onDelete: Cascade)` (where `User` is a stub model for FK validity — see below)
  - `@@unique([athleteId, exerciseId])` → `@@unique([userId, exerciseId])`
  - `@@index([exerciseId])` — keep
  - Add `@@index([userId])` if not implied
- **PerformedSession changes**:
  - `athleteId String` → **rename to** `userId String`
  - Relation: `athlete Athlete @relation(...)` → **replace with** `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`
  - `@@unique([sessionId, athleteId])` → `@@unique([sessionId, userId])`
  - `@@index([athleteId])` → `@@index([userId])`
- **PerformedExerciseInstance**: no FK changes; only indirect impact via PerformedSession.

### D3 — Full-scope port lives downstream

This step does NOT touch `packages/api-server/prisma/schema.prisma`. But your output is the spec Step 2 reads. The ratified analysis-schema must contain the **full** set of entities (catalogue + plan-content + athlete-facing) so Step 2 ports them all. Do not delete any other entities beyond `Athlete`.

### D4 — Library vs Configuration split

- `Exercise` and `Label` are **libraries**: coach-managed via admin UI, NOT seeded by the system, used for future analytics. Mark this distinction in `implementation-notes.md`.
- `Archetype` is **configuration**: part of the model itself; 34 canonical entries are mandatory seed at Step 2; no admin CRUD. `archetypeParamsSchema Json` stays on the Prisma model (not enum) so the catalog can evolve without redeploy.
- Reflect the library/configuration split in `implementation-notes.md` (new section) AND `domain-model.md` (annotate each catalog entity).

## Treatment of cross-schema FK references

The analysis-schema is a **training-domain slice**, not the full app schema. Several FKs point to models that live in app-level `packages/api-server/prisma/schema.prisma` (`User`, `TrainingPlan`). For analysis-schema to be a valid, self-consistent Prisma DSL fragment, add minimal **stub models** at the end:

```prisma
// Stub: lives in app-level packages/api-server/prisma/schema.prisma.
// Declared here only so this slice parses and FK relations resolve.
model TrainingPlan {
  id    String @id
  weeks Week[]
}

// Stub: lives in app-level packages/api-server/prisma/schema.prisma.
// Declared here only so this slice parses and FK relations resolve.
model User {
  id                String             @id
  oneRMRecords      OneRMRecord[]
  performedSessions PerformedSession[]
}
```

Add a comment block at the top of `schema.prisma` (after the existing `generator` / `datasource` blocks) declaring this is a training-domain slice and naming the stub models.

## Tasks per file

### Task 1 — `analysis/artifacts/06-formalization/schema.prisma`

This is the **anchor artifact**. All other docs derive from it.

1. Add a header comment block (right under existing `datasource db {...}` block) explaining:
   - This file is the canonical Prisma DSL for the training-domain slice.
   - Integration target: `packages/api-server/prisma/schema.prisma` already contains `User`, `CoachProfile`, `AthleteProfile`, `TrainingPlan`, `PlanEnrollment`, `CoachAthleteAssignment`.
   - `TrainingPlan` and `User` appear here as stub models for FK validity.
   - Updated `2026-05-12` per D1-D4 (reference `implementation/PLANNING_STATE.md`).
2. Add `enum DayOfWeek { MONDAY ... SUNDAY }` (next to other enums, alphabetical or grouped — match existing style).
3. Add `model Week { ... }` (place it just before `model Day` so the cascade `TrainingPlan → Week → Day → Session → ...` reads top-down).
4. Modify `model Day`:
   - Remove `order Int` line.
   - Add `weekId String`.
   - Add `dayOfWeek DayOfWeek`.
   - Add relation `week Week @relation(fields: [weekId], references: [id], onDelete: Cascade)`.
   - Replace any existing `@@index([order])` or similar with `@@unique([weekId, dayOfWeek])` and `@@index([weekId, dayOfWeek])`.
   - Keep existing `labelId`, label relation, `notes`, `createdAt`, `updatedAt`, `sessions Session[]`, `@@index([labelId])`.
5. Remove `model Athlete { ... }` entirely.
6. Modify `model OneRMRecord` per D2.
7. Modify `model PerformedSession` per D2.
8. Append the two stub models (`TrainingPlan`, `User`) at the bottom with the marker comments shown above.
9. Verify the file parses as Prisma DSL by careful read-through. If you have access to `pnpm exec prisma format` or equivalent against this fragment, you may run it (read-only validation; do not commit the formatter output unless it matches your hand-formatting; if it disagrees on whitespace, prefer the formatter output). Do NOT run `prisma generate` or `prisma migrate` — those would touch generated client and DB.

### Task 2 — `analysis/artifacts/06-formalization/er-final.md`

Read the file first to learn the diagram format (Mermaid? ASCII? table?). Then:

1. Update the diagram(s) to:
   - Add `Week` node between `TrainingPlan` (or implicit "plan root") and `Day`.
   - Edge `Week 1—N Day` instead of any prior root→Day edge.
   - Remove `Athlete` node entirely (or relabel as `User` with a footnote pointing to app-level schema).
   - Update `OneRMRecord` and `PerformedSession` edges: point to `User` (stub, external).
2. Update any cardinalities table to reflect:
   - `TrainingPlan 1 — N Week`
   - `Week 1 — N Day (≤7)`
   - `Day 1 — N Session`
   - `User 1 — N OneRMRecord`
   - `User 1 — N PerformedSession`
3. Update any per-entity field tables to match `schema.prisma` (Week added; Day changed; Athlete removed; OneRMRecord/PerformedSession updated).
4. Add a "Revision" line at the top (or bottom, matching existing convention): `Revised 2026-05-12 — D1-D4 applied (Week-as-calendar, Athlete merged into User+AthleteProfile, profileAttributes dropped, library/config split). See implementation-notes.md.`

If the file uses a format you don't recognize or the rewrite requires fundamental restructuring (e.g., Mermaid layout that doesn't accommodate Week cleanly), **STOP** and surface the issue in `output.md` "Возникшие вопросы".

### Task 3 — `analysis/artifacts/06-formalization/implementation-notes.md`

Read the file fully first (it's long). Then:

1. Add a new top-level section near the top (or in the chronological ratifications area, if such pattern exists):

   ```markdown
   ## Phase 7 — Integration Ratifications (2026-05-12)

   These ratifications resolve OPEN items from Phase 6 by aligning the training-domain slice with the existing app schema (`packages/api-server/prisma/schema.prisma`).

   ### D1 — Calendar Week as entity

   [restate D1 from this prompt, in coach-language]

   ### D2 — Athlete identity = User + AthleteProfile; profileAttributes dropped

   [restate D2]

   ### D3 — Full-scope port at Step 2

   [restate D3]

   ### D4 — Library vs Configuration split

   [restate D4; flag Exercise/Label as libraries, Archetype as configuration]
   ```

2. Locate any OPEN items / TODOs / "decide later" markers that are now resolved by D1-D4, and update them:

   - "Connection to TrainingPlan/PlanEnrollment" → **CLOSED** by D1 (link via `Week.planId`)
   - "Week / Plan entities — out-of-scope, Phase 8+" → **REVISED** — Week ratified as calendar slot; Plan stays in app-level schema unchanged
   - Anything referencing `profileAttributes` finalization → **DROPPED** per D2
   - Anything referencing `Athlete` as a standalone entity → **DROPPED** per D2
     Don't delete original lines; add a `**RATIFIED 2026-05-12**: <decision> — see "Phase 7 Ratifications"` line directly below each. Preserve historical traceability.

3. If the file has a section listing **archetype catalog** with all 34 archetype names + params — verify that `super-set` is documented; if not, add it as a Phase 7 archetype (ratified earlier — covered in stress-final per Phase 7 work; for this step, just ensure it's listed). If unsure whether `super-set` is already in the catalog, search the file; if absent, add a brief entry.

4. If the file has a section on `Intensity` Zod schema admitting `hrZone` and `numericPace` (Phase 7 deferrals), confirm these stay. No change needed if already present.

### Task 4 — `analysis/artifacts/06-formalization/types.ts`

Minimal, surgical changes:

1. Find and **delete** any TypeScript type/interface named `Athlete`.
2. Find and **delete** any `profileAttributes` field on that type (if it existed separately).
3. Update `OneRMRecord` type: `athleteId: string` → `userId: string`.
4. Update `PerformedSession` type: `athleteId: string` → `userId: string`.
5. **Add** type for `Week`:
   ```ts
   export interface Week {
     id: string;
     planId: string;
     startDate: string; // ISO date (Monday of ISO week)
     notes: string | null;
     createdAt: string;
     updatedAt: string;
   }
   ```
6. Update `Day` type: remove `order: number`; add `weekId: string`; add `dayOfWeek: DayOfWeek`.
7. Add `DayOfWeek` enum/union type: `export type DayOfWeek = "MONDAY" | "TUESDAY" | ... | "SUNDAY"` (or `enum` if other enums use `enum`; match existing style).
8. **Scope guard**: if these changes cascade into >40 lines of additional edits (e.g., other types referencing `Athlete`), **STOP** and document the cascade in `output.md`. Make a smaller scoped change and defer the cascade for a follow-up.

### Task 5 — `analysis/artifacts/05-synthesis/domain-model.md`

Read the file. Then:

1. Add a new top-level section "Week (Phase 7 ratification, 2026-05-12)" describing Week-as-calendar-slot semantics from the coach's POV. Keep it short (1-2 paragraphs). Include:
   - Why a Week entity exists despite plans being indefinite "trains" (atomic week-level ops, per-week notes).
   - Calendar-Mon-Sun semantics.
   - Relationship to `TrainingPlan` (parent) and `Day` (child via `dayOfWeek`).
2. **Replace** the entire `Athlete` section with a new section "Athlete identity (ratified 2026-05-12)":
   - One paragraph: in this slice, "Athlete" means a `User` with `role=ATHLETE` and an `AthleteProfile`. The slice references `User` directly.
   - Note: `profileAttributes` from earlier draft is dropped — Phase 6 placeholder for dual-value resolver / level / RX-SC tier. Future needs land on `AthleteProfile` as explicit enum columns.
3. Update the `Day` section: order → dayOfWeek + weekId.
4. Annotate catalog entities (`Exercise`, `Label`, `Archetype`) in their respective sections with the library-vs-configuration tag from D4. Two lines each.
5. If the file has a "Cardinality cheatsheet" or similar, update it (TrainingPlan → Week → Day → ...).
6. Append a "Revision 2026-05-12" line at the file head (or where convention dictates).

### Task 6 — `analysis/artifacts/05-synthesis/er-diagram.md`

Sync with the changes in `06-formalization/er-final.md`:

- Week node added.
- Athlete → User (stub).
- OneRMRecord / PerformedSession → User.
- Day no longer has `order`; references `weekId` + `dayOfWeek`.

Use the file's existing diagram format. Mark revision date.

### Task 7 — `implementation/step-01/output.md`

Required deliverable. Format (use these exact section headers):

```markdown
# Step 1 — Output

## Что сделано

<3-5 lines summary>

## Изменённые/созданные файлы

- [list paths]

## Принятые решения

<for each ambiguity you resolved without escalating: what you chose and why>

## Возникшие вопросы и как решены

<for each ambiguity that you DID escalate or that needed user thinking: question + your hypothesis + resolution>

## Что отложено

<for each thing you identified as future work but did not handle>

## Ссылка на `.feature-dev/<ts>/`

N/A — Step 1 не использует /feature.

## Сценарий смоук-теста

N/A — Step 1 не затрагивает UI или runtime.

## Verification notes

<any sanity checks you ran: did schema.prisma parse, did you confirm OPEN-items in implementation-notes were addressed, etc.>
```

## Hypothesis bank (apply silently, no need to ask)

These cover micro-ambiguities you may hit. If your situation matches one, apply the hypothesis; document in "Принятые решения".

- **Index naming / cascade rules**: follow existing analysis-schema conventions. If unclear: `onDelete: Cascade` for owned hierarchy edges (Week→Day, Day→Session, Session→Block, Block→Schema, Schema→SchemaRow). `onDelete: Restrict` for catalog references (Exercise, Archetype, Label).
- **Mermaid vs ASCII diagram**: keep whichever format already exists in the file. Don't switch formats.
- **Markdown heading levels**: keep the file's existing depth. Don't bump levels.
- **Comment style in Prisma**: triple-`//` for top-of-file blocks, single `//` for inline notes. Keep it sparse.
- **If a referenced item doesn't exist** (e.g., `implementation-notes.md` has no "OPEN items" section): note it in `output.md` "Принятые решения", do not invent a section.

## Hard escalation triggers (STOP and surface to user)

If any of these surface, halt your work, write a partial `output.md` describing where you stopped, and tell the user clearly in chat:

1. A stress-test case in `stress-test.md` / `stress-final.md` is **broken** by D1/D2 (e.g., a test relies on `Athlete.profileAttributes` being a Map, or on `Day.order` being sparse).
2. You find code outside `analysis/` that already implements parts of this domain (admin module, platform module, Prisma model, etc.) — this would be a residue of the deleted prior attempts, and the user wants to know.
3. The cascade in `types.ts` exceeds ~40 lines (suggests deeper structural coupling).
4. `schema.prisma` does not parse as Prisma DSL after your edits (and you can't tell why).
5. `er-final.md` or `er-diagram.md` requires fundamental restructuring (not local in-place edit) to accommodate Week.
6. You find a memory entry or any other artifact suggesting prior implementation details — STOP per workflow rules.

## Acceptance criteria (you self-check before finalizing output.md)

- [ ] `schema.prisma` has `Week` model, `DayOfWeek` enum, updated `Day`, no `Athlete`, updated `OneRMRecord` / `PerformedSession`, stub `User` and `TrainingPlan`, header comment block.
- [ ] D1-D4 are visible in `implementation-notes.md` under a dated "Phase 7 Ratifications" section.
- [ ] OPEN items in `implementation-notes.md` (TrainingPlan integration, Week/Plan entities, profileAttributes) annotated as resolved.
- [ ] `domain-model.md` has Week section, Athlete identity section (replacement), library/configuration tags on Exercise/Label/Archetype.
- [ ] `er-final.md` diagram and cardinalities updated.
- [ ] `er-diagram.md` synced.
- [ ] `types.ts` minimally updated (no `Athlete` type, `Week` added, `DayOfWeek` added, `Day` updated, FK fields renamed).
- [ ] Stress files NOT touched (or if touch was necessary because of broken test — you escalated instead).
- [ ] `output.md` written per format.
- [ ] No code outside `analysis/` and `implementation/step-01/` touched.
- [ ] No installs, builds, tests, generators run.

## Order of operations (suggested)

1. Read all 6 input artifacts fully before editing any (helps you spot cross-file consistency issues).
2. Edit `schema.prisma` first — the anchor.
3. Edit `er-final.md` and `er-diagram.md` next — they mirror the schema.
4. Edit `types.ts` — surgical.
5. Edit `implementation-notes.md` — add ratifications section, close OPEN items.
6. Edit `domain-model.md` last — narrative depends on the rest being consistent.
7. Write `output.md` last.

## Final reminder

You are part of a careful, deliberate workflow. The user has burned three attempts at this domain by rushing. Be precise. Read fully before editing. Surface hesitations with hypotheses. Stop on hard triggers. Keep the language inside files in English; if you need to write Russian narrative, only in `output.md` "Возникшие вопросы" / "Принятые решения".

Good luck.
