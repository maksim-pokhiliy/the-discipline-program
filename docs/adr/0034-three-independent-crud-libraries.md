# 0034. Three independent CRUD libraries (Exercise, BlockKind, SchemeTemplate)

- **Status:** Accepted
- **Date:** 2026-04-26
- **Tags:** `lms`, `data-modeling`, `libraries`, `breaking-change`

> Status flipped from Proposed to Accepted: the three-library split (Exercise / BlockKind / SchemeTemplate) has landed and is load-bearing in code; see ADRs 0030 and 0031 for snapshot and scheme-params details.

## Context

A coach building plans needs to compose three different kinds of vocabulary at three different levels of granularity:

- **Exercises** — the atomic movements ("Strict Pull-up", "DB Snatch", "1RM Back Squat"). Hundreds, with rich per-item metadata: primary movement pattern, modality, equipment, body parts, skill level, default metrics, demo video, benchmark eligibility.
- **Block kinds** — the categorization layer above movements ("WARM_UP", "METCON", "STRENGTH", "ACCESSORY"). A small handful (~10 SYSTEM defaults), with display metadata (icon, default weight for compliance, default execution archetype).
- **Scheme templates** — named patterns for execution ("EMOM-12 simple", "AMRAP-15", "5×3", "Tabata"). Drag-to-apply onto a block segment. Each is bound to one of six execution archetypes with default parameters.

Earlier discussions considered combining these into a single tagged catalog. That collapses three different shapes into one — `BlockKind` has fields Exercises do not (`defaultArchetypeKind`, `analyticsCategory`, `defaultWeight`); `SchemeTemplate` has fields the others do not (`archetypeKind`, `defaultParams`); `ExerciseLibraryItem` has fields the others do not (movement pattern, modality, equipment, etc.). A union type or polymorphic table would either lose type safety (most fields nullable) or be unwieldy (24 columns mostly empty per row).

The three vocabularies also have different mutation rates. Exercises are added regularly (hundreds, with new ones for each piece of equipment). Block kinds are nearly static (10 entries plus the occasional gym-specific addition). Scheme templates are added by coaches as they accumulate favorite patterns. Mixing them under one CRUD UI loses the ergonomic distinctions that match each rate.

A separate tension: scheme execution itself. Each archetype binds to a hardcoded timer state machine in `@repo/workout-engine` (M3 deliverable). If `SchemeArchetype` were a CRUD entity, an admin could create an archetype the timer FSM does not exist for, breaking the athlete UX silently. Archetypes must be enum values in code, not rows in a table. SchemeTemplate is the CRUD layer above, the part that captures named patterns of archetype + parameters.

## Decision

We define three independent CRUD entities, each backed by its own table, with a shared SYSTEM/COACH scope model:

1. **`ExerciseLibraryItem`** — `lms_exercise_library`. Carries the full per-exercise metadata. Supports variants via `parentId`, supersession via `supersedesId`, soft delete via `deletedAt`, version via `version`. M0 seed: ~100 SYSTEM rows; M1 admin can grow to ~500.
2. **`BlockKind`** — `lms_block_kinds`. Carries display + default-execution + analytics-categorization metadata. Soft delete. M0 seed: 9 SYSTEM rows (WARM_UP, COOLDOWN, METCON, STRENGTH, GYMNASTICS, ACCESSORY, CORE, RUN, SKILL).
3. **`SchemeTemplate`** — `lms_scheme_templates`. Carries `archetypeKind` (enum) plus `defaultParams` (JSON validated by the same discriminated union as `BlockSegment.schemeParams` per ADR-0031). Soft delete. M0 seed: ~5 SYSTEM rows.

`SchemeArchetype` is **not** a table. It is a `SchemeArchetypeKind` enum in code with six values, bound to six timer FSMs in `@repo/workout-engine`. The enum lives in the Prisma schema (for typing the discriminator on `BlockSegment` and `SchemeTemplate`), in `packages/contracts/src/entities/lms/_domain/scheme-archetype.schema.ts` (for zod), and is consumed by code in `@repo/workout-engine`. Adding a seventh archetype is a code change, never a database change.

The shared scope model:

- `LibraryScope` enum: `SYSTEM | COACH`.
- SYSTEM rows have `ownerId IS NULL`, visible to everyone, mutable only via `apps/admin` (admin or head coach role).
- COACH rows have `ownerId = userId of creating coach`, visible to that coach plus admin/head coach, mutable by that coach via `apps/platform/library` (and by admin/head coach via `apps/admin`).
- `@@unique([scope, ownerId, name])` on each library — SYSTEM has one canonical name; coaches can each carry their own item with the same name.
- Promote (COACH → SYSTEM) and demote (SYSTEM → COACH) operations live in `apps/admin`. They mutate `scope` and `ownerId` in place; they do not clone. References from `ExerciseEntry`/`Block`/`BlockSegment` remain valid. M0 implements the database operations as 501 stubs; M1 builds the admin UI.

Every entry that references a library item snapshots the library state at insert time per ADR-0030.

## Consequences

**Positive:**

- Each library has a UI shaped to its content — exercises get rich filter/search by movement pattern; block kinds get a tiny grid; scheme templates get a per-archetype form. No "tag-based catalog" hand-waving.
- Type safety per library — `BlockKind` and `ExerciseLibraryItem` cannot get confused at any layer.
- Promote-without-clone keeps history clean: a coach's favorite custom exercise becomes SYSTEM without breaking any existing plan that uses it.
- `SchemeArchetype` enum-in-code prevents the "admin creates an archetype with no FSM" failure mode entirely.

**Negative:**

- Three CRUD UIs to build (M1) instead of one. The cost is real but bounded — each UI is a list + a form, the same skeleton three times. Storybook stories per library help.
- Three M0 seed sources to maintain. We mitigate by colocating seed under `prisma/seed/lms/{block-kinds,scheme-templates,exercises}.ts` with idempotent upsert keyed on `(scope, ownerId, name)`.
- `SchemeArchetype` as enum-in-code means a new archetype is a coordinated change across schema, contracts, workout-engine, and any UI affordance. Acceptable: adding an archetype is a yearly event at most, and it should be a deliberate cross-package PR.

**Neutral:**

- The libraries share a scope model but not their data — `ExerciseLibraryItem` does not derive from `BlockKind`. They are siblings under a shared permission policy.
- Promote-conflict resolution (when `COACH (ownerId=X, name=Y)` collides with existing `SYSTEM (name=Y)` during promote) is an admin-side resolve flow. M0 leaves promote/demote as 501 stubs; M1 builds the resolve UI (rename or merge).
- `BlockKind.analyticsCategory` lets the dashboard group blocks for cohort views ("how much metcon volume this week"). The exact set of analytics categories is seeded by SYSTEM and may be tuned in admin (`SystemSettings.analyticsCategories`).

## Alternatives considered

**One unified "library" table with a `kind` discriminator.** Rejected: massive nullable surface; UI cannot ergonomically share components across the three shapes; adding a fourth library type later (e.g., `EquipmentLoadout`) is the same problem cubed.

**Hierarchy: BlockKind contains scheme templates contains exercises.** Rejected: the relationship is not containment, it is composition. A scheme template applies to a block segment regardless of block kind; an exercise can appear in any block kind. Forcing a containment hierarchy breaks the cross-cutting reuse pattern.

**`SchemeArchetype` as a CRUD entity.** Rejected for the FSM-binding reason in Context. Allowing a runtime archetype is a cute idea that produces silent failures in the athlete UX.

**No COACH-scope library, only SYSTEM admin-managed.** Rejected: coaches keep custom exercises (alternate names for the same movement, gym-specific equipment variants). Forcing them through admin promotion before they can use a custom exercise on their plans is a user experience disaster. The COACH scope plus optional promotion path is the right balance.

**Per-team libraries (multi-tenant scoping).** Rejected — out of scope per ADR-0032.

## References

- `docs/design/workout-redesign.md` §4 (three libraries) and §4.4 (scope and permissions).
- ADR-0030 — snapshot strategy applies to entries referencing all three libraries.
- ADR-0031 — JSON discriminator (used by `SchemeTemplate.defaultParams` and `BlockSegment.schemeParams`).
- ADR-0032 — single-team simplification (the basis for the SYSTEM/COACH-only scope).
