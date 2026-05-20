# Decisions ratified

> Canonical D-numbered decisions catalog. Each entry preserves full ratification body. Newest groups at top per chronological ratify date.

## 2026-05-20 — Step 8.1c — `SchemaPairing` → `AlternatingGroup` redesign (D14)

- **D14 (`SchemaPairing` → `AlternatingGroup` N-ary redesign).** Surfaced during the Step 8.1c thesis cycle: `SchemaPairing` was modelled as a 2-FK pair (`schemaAId` + `schemaBId`), but the `alternating-sets` archetype is an **N-ary** relation — a coach links 2..N schemas into one alternating cycle, no upper bound. The `analysis/` model generalised "pair" from a single cardinality-2 sample (block-009); `edge-cases.md` §1.2 had explicitly flagged that as provisional ("cardinality растёт ... archetype validates как general-purpose"). The user (domain expert) corrected it. Escalated and ratified per the WORKFLOW.md "Domain-model change protocol" before any code; Step 8.1c is the mandated schema-change sub-step. **Shipped Step 8.1c 2026-05-20** (`aec22f8a..76bb334c`). Ratified consequences:

  - `model SchemaPairing` (2-FK pair) + `enum SchemaPairingRelation` dropped. `model AlternatingGroup` added — a block-scoped N-ary grouping entity; `enum AlternatingGroupRelation { ALTERNATING_SETS }`.
  - Membership = single nullable FK `Schema.alternatingGroupId` — a schema belongs to **at most one** group (structural; no junction table — a schema cannot alternate in two cycles at once).
  - `ArchetypeAlternatingSetsParams.pairedWithSchemaId` dropped (superseded by the group entity); `setEnumeration` retained.
  - `super-set` archetype (Q20) untouched — it is an ordered exercise sequence within ONE schema, unrelated.
  - Decomposition: **Step 8.1c** = model definition (Prisma + contract + analysis + seed); **Step 8.1d** = `lmsAlternatingGroupApi` + guard + mapper against this shape.

- **D-A1 (`AlternatingGroup` Prisma shape + `onDelete`).** `AlternatingGroup { id, blockId, relationKind, createdAt, updatedAt }`. `onDelete`: `AlternatingGroup.block` → `Cascade` (deleting a Block deletes its groups); `Schema.alternatingGroup` → `SetNull` (deleting a group leaves member schemas alive and ungrouped — the "delete = unlink, schemas survive" requirement). Timestamps — yes; `AlternatingGroup` is a managed mutable entity (members add/removed in 8.1d), unlike the bare `BlockLabelAssignment` join row. The shrink-below-2 → dissolve-vs-reject behaviour is Step 8.1d api logic, not model shape.

- **D-A2 (contract `Schema` not extended).** Prisma `Schema` gains `alternatingGroupId`, but the contract `schemaSchema` / `mapToSchema` are NOT changed in 8.1c — group membership is read via a future `AlternatingGroup` embed (mirrors the Step 8.3.5 `schemas[]` read-embed pattern). Keeps 8.1c scoped to "define the entity".

- **D-A3 (naming).** Entity `AlternatingGroup`; Prisma enum `AlternatingGroupRelation`; table `training_alternating_groups`; contract slice `alternating-group/`. User picked `AlternatingGroup` 2026-05-20 (over the planner working-name `SchemaGroup`).

- **C-A1 (no member order on the group).** `AlternatingGroup` carries no member-order column; the alternation sequence lives in each schema's `archetypeParams.setEnumeration`, render order = `Schema.order`. Contract `schemaIds` is an unordered-set array.

## 2026-05-18 — Step 8 trajectory (D9-D13)

- **D9 (Step 8 split policy).** Decomposition granularity для всего Step 8 trajectory = review/test/ship-friendly chunks; 15+ sub-steps acceptable; no monster PRs. Drives sub-step pattern: 8.0a (VO infra) → 8.0b (entity contracts) → 8.1a/b/c (api-server per entity Schema/SchemaRow/SchemaPairing) → 8.2 (HTTP routes) → 8.3 (client hooks) → 8.3.5 (schemas[] read-embed enabler) → 8.3.6 (SchemaRow @@unique) → 8.3.7-pre (WORKFLOW-001 fix) → 8.3.7 (Schema partial-unique constraint) → 8.4 (ArchetypePicker + 3-4 hand-rolled archetype forms — first coach-visible Schema editor) → 8.5..8.N (progressive 30 archetype forms; hand-roll vs generic fallback ratify per sub-step thesis). Each sub-step wraps в `/feature small` или `/feature` full per planner pick per scope. Calendar 6-8 weeks realistic.

- **D10 (SubSchema = Schema self-reference).** Contract slice uses single `schemaSchema` с optional `parentSchemaId` + recursive `SchemaWithBody` type per `analysis/artifacts/06-formalization/types.ts:653-657`. Mirror Prisma `parentSchemaId` self-reference + `subSchemas Schema[] @relation("SchemaSubSchemas")`. Sub-schema invariant `sub.kind === "ATOMIC"` validated at Zod refinement (per domain §1.5 "Sub-schema всегда `kind === 'atomic'`"). Writes: discriminated parent-scope arg `{blockId: string}` для top-level OR `{parentSchemaId: string}` для sub-schemas.

- **D11 (SchemaPairing UI deferred к Step 9/10).** Contract + api shipped в Step 8.0b/8.1c (compositional foundation); UI = inter-Schema operation (link two schemas с relationKind ALTERNATING_SETS), coach can survive без это initially. Materializes только когда super-set archetype UX surfaces feedback OR Step 10 happy-path validation reveals need.

- **D12 (`Schema.trailingConnector` field canonical; drop `RowKind.CONNECTOR`).** Real prisma имеет ОБОИХ — `Schema.trailingConnector Json?` field + `RowKind.CONNECTOR` enum value. Domain §1.4 говорит field, §1.6.9 говорит row (Phase 6 не зафиксировал персистенс). Decision: **field canonical** per coach POV "then 3 rounds = модификатор на schema-to-schema transition (meta), не content tail of body". Engineering: cleaner data shape, no double-encoding hazard, render logic не фильтрует CONNECTOR row из body iteration. Cost = drop `CONNECTOR` from `RowKind` enum в `packages/api-server/prisma/schema.prisma` + sync `analysis/artifacts/06-formalization/{schema.prisma, types.ts SchemaRowPayload variant, er-final.md if relations change}` + reframe domain-model.md §1.6.9 — **shipped Step 8.0b 2026-05-18** (`4d39b8ac` prisma drop + `1ee64b62` analysis sync). ConnectorForm enum survives (lives в `_shared/enums.ts` shipped Step 8.0a для Schema.trailingConnector field consumption).

- **D13 (WORKFLOW-001 fix path (i)).** Explicit Step 8.3.7-pre admin sub-step before Schema partial-unique constraint shipping. WORKFLOW-001 surfaced Step 7.3.6 (db:seed creates HEAD_COACH; tests create HEAD_COACH; partial unique `idx_single_head_coach` (created в `scripts/apply-sql-checks.ts`) blocks 2nd → P2002 → tests fail unless reset-without-seed-and-checks). Path (i) options surfaced at 8.3.7-pre thesis: (a) new `db:reset:for-tests` npm script alias that skips `apply-sql-checks.ts`; (b) update test setup к find-and-reuse seed HEAD_COACH instead of creating new; (c) document `reset-without-seed-and-checks` convention в WORKFLOW.md § "DB migrations & seed". Picks at 8.3.7-pre thesis-time. Pays off для всех downstream SQL-constraint tests beyond Schema partial-unique (Step 8.3.7 + future constraint additions). **SUPERSEDED 2026-05-20:** WORKFLOW-001 was resolved inline in Step 8.1c (commit `8c3a701b`, path (b) — the 2 colliding test files demote the seeded `HEAD_COACH` before promoting their fixture, matching 4 sibling files already on the pattern). **Step 8.3.7-pre is DROPPED** — its sole purpose is discharged. See `log/step-08.1c.md` + `01-step-queue.md`.

## 2026-05-15 — Calendar slots + namespace correction (D6-D8)

- **D8 (`Label` and `Exercise` contracts + api-server endpoints/mappers live in `lms/*`, not `cms/*`).** Surfaced during Step 6.2 thesis cycle when D7-ratified embed `label: Label | null` in `getWeekResponseSchema` failed the dep-cruiser rule `contracts-lms-no-coaching-cms-billing` (`.dependency-cruiser.cjs:47-58`, forbids `contracts/lms/*` → `contracts/cms/*`). Every other signal already classifies both entities as LMS catalogs: Prisma `@@map("training_labels")` + `@@map("training_exercises")`, FK relations from `Day.labelId`, `Session.labelId`, `BlockLabelAssignment.labelId`, `SchemaRow → Exercise (via OneRMRecord)`, `OneRMRecord.exerciseId`. Step 4 (Admin Label CRUD) placed the contract in `cms/label/` mirroring the earlier Step 3 (Admin Exercise CRUD) — neither step ran an architectural review against `docs/BOUNDED-CONTEXTS.md` §1+§8 (which lists CMS as "marketing surface"; Label/Exercise are not marketing). Ratified consequences:

  - `packages/contracts/src/entities/cms/{label,exercise}/` → `packages/contracts/src/entities/lms/{label,exercise}/` (14 files, 706 LOC, no internal logic change).
  - `packages/api-server/src/endpoints/cms/{label,exercise}/` → `endpoints/lms/{label,exercise}/` (4 files, 839 LOC).
  - `packages/api-server/src/mappers/cms/{label,exercise}.mapper.ts` → `mappers/lms/{label,exercise}.mapper.ts` (37 LOC).
  - `mappers/cms/enum-maps.ts` split — CMS-pure (Currency/PriceInterval/BlogCategory/ContactStatus) stays; Exercise enums (Equipment/MovementType/CanonicalCompoundType) extract to new `mappers/lms/exercise.enum-maps.ts`.
  - dep-cruiser `admin-no-lms` carve-out widened — 4 new `pathNot` entries for new lms paths so admin keeps Library access.
  - No Prisma changes — `@@map("training_*")` already correct.
  - No analysis-artifacts changes — model semantics unchanged.
  - Historical paper-trail preserved — Step 3 / Step 4 entries в archive keep the `cms/label` / `cms/exercise` mentions (point-in-time truth).
  - Step 6.1.5 implemented this в 1 squashed commit (`5332c034`, 2026-05-16). Originally planned as 4 atomic per-layer commits under `/feature small`, collapsed at executor run-time after `.husky/pre-commit` blocked the intermediate broken-import tree — 5th-flavour planner-discipline miss `instinct-process-blindness` (see [[husky-cross-package-squash]]).

- **D7 (Day is a lazily-materialized calendar slot, mirror of D6).** The "day-level operations" framing in the original queue Step 6 — Day add / edit / reorder / delete — was rejected by the user during the Step 6 thesis cycle: "ты не можешь редактировать ось времени. при входе на plan details ты видишь неделю — 7 строк, по одной на каждый день, и когда тренер заходит — ему не нужно 'создавать дни', ему нужно управлять тренировочными сериями. думай как тренер". Ratified consequences:

  - No coach-facing "add day" / "delete day" / "reorder day" UX. `dayOfWeek` is a fixed enum axis (D1); the 7 weekday rows are always visible because they are a calendar fact, not data. Day slot identity = `(weekId, dayOfWeek)`.
  - A `Day` DB row materializes lazily via `prisma.day.upsert` (per `(weekId, dayOfWeek)`) on first Session create / first label set / first notes set.
  - Day is addressed externally by `(planId, startDate, dayOfWeek)`, not by `dayId`. `dayId` server-internal; client never sees as address.
  - No POST-create-day / DELETE-day routes. No "clear day" UI (a Day-row that becomes empty stays as a breadcrumb; auto-cleanup races concurrent writes and saves no meaningful space).
  - `getWeekResponseSchema` returns all 7 weekdays; materialized-or-not invisible to client (unmaterialized slot = `{ label: null, notes: null, sessions: [] }`).

- **D6 (Week is a lazily-materialized calendar slot, not a managed entity).** Plan-detail surface is a calendar viewport, not a week-list manager. Settled during Step 5 thesis discussion.
  - No coach-facing "add week" / "remove week" / "add first week" UX. Coach navigates calendar axis (week = viewport unit, no free calendar scroll).
  - Week DB row materializes lazily — upsert by `(planId, startDate)` on first Day create OR first per-week note. Empty weeks = no Week row.
  - Weeks addressed by `(planId, startDate)`, not `weekId`. Read-mostly API surface: `GET .../weeks/[startDate]` + notes upsert.
  - Plan-detail body layout: 7 full-width day rows (Mon–Sun), not 7 columns. Day is a nested document (Session→Block→Schema→SchemaRow), not a calendar event; 7 columns at `maxWidth="lg"` give ~140px/day and content dies.
  - Week navigation: prev/next + jump-to-date + "today"; default on open = current calendar week, `?week=<startDate>` URL param overrides.

## 2026-05-13 — Exercise model refinement (D5)

- **D5 (defaultDemoUrl → defaultDemoUrls String[]).** Single URL field replaced by Postgres native string array. Coach can attach multiple demo videos per exercise without limit. Native `String[]` over `Json?` for type-safety and no JSON parsing overhead. Applies to both `analysis/artifacts/06-formalization/schema.prisma` (anchor spec) and real `packages/api-server/prisma/schema.prisma`. Step 3 Phase 0 implemented the schema refinement (with analysis-artifact sync) before any UI work.

## 2026-05-12 — Foundation architecture (D1-D4)

- **D1 (Calendar Week as entity).** Explicit `Week` model between `TrainingPlan` and `Day`. Week is a calendar slot (Mon-Sun ISO week), not a relative "week 1, week 2" of a fixed program.

  - `Week { id, planId, startDate Date (Monday of ISO week), notes String?, createdAt, updatedAt }`. Unique `(planId, startDate)`.
  - `Day` no longer has `order Int`. Replaced by `dayOfWeek DayOfWeek` enum (MONDAY..SUNDAY). `Day { id, weekId, dayOfWeek, labelId?, notes?, ts }`. Unique `(weekId, dayOfWeek)`.
  - New enum `DayOfWeek { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY }`.
  - Derived (not stored): week end date = `startDate + 6 days`; ISO year+week number; per-day calendar date.
  - Plan is a "train", weeks are slots the coach fills as time moves forward. No fixed end.

- **D2 (Athlete = User+AthleteProfile, no profileAttributes).** No standalone `Athlete` model. `OneRMRecord.userId → User.id`. `PerformedSession.userId → User.id`. `profileAttributes` (Phase 6 placeholder for dual-value resolver / level / RX-SC tier) dropped entirely — premature without concrete UX. Future additions (e.g., `level`, `modalityTier`) go as explicit enum columns on `AthleteProfile`, not jsonb.

- **D3 (Full-scope port at Step 2).** All ratified entities — catalogue (Exercise, Label, Archetype), plan-content (Week, Day, Session, Block, BlockLabelAssignment, Schema, SchemaPairing, SchemaRow), athlete-facing (OneRMRecord, PerformedSession, PerformedExerciseInstance) — go into `packages/api-server/prisma/schema.prisma` at Step 2, even though athlete-flow UI/API stays out of scope. Avoids a second schema-change wave mid-workflow.

- **D4 (Library vs Configuration split).** `Exercise` and `Label` are libraries — created/managed by coach in admin UI, used for future analytics. NOT seeded; coach populates via admin during smoke-test. `Archetype` is configuration — part of the model itself; full canonical set (34) MUST be seeded at Step 2. No admin CRUD for Archetype (UI-editing it is meaningless without parser+renderer updates). `archetypeParamsSchema` lives in DB (Prisma model) rather than code to allow patching without redeploy.
