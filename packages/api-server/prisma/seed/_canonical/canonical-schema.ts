// Canonical shape for the Demo Plan seed pipeline.
//
// This schema defines the canonical Demo Plan structure. The plan is produced
// by the typed builder in `_canonical/builder/` and assembled in
// `_canonical/plan-synthetic/` as a fully-typed `SYNTHETIC_DEMO_PLAN` const.
// It is validated by `canonicalSeedSchema` at seed time in
// `canonical-plan/load-and-validate.ts`, then written to Prisma by the emit
// chain (catalog → plan → blocks → schemas → rows).
//
// DRY policy: every VO / archetype-params / row-payload schema is imported
// verbatim from `@repo/contracts/lms` to guarantee zero drift between the
// canonical plan and the production Prisma write path. Only entity hierarchy
// shells + catalog entries + reference-ID newtypes are defined locally.
//
// Reference IDs:
//
//  - Block instances:     `block-NNN` (NNN ∈ 001..198).
//  - Sheets:              `sheet-NN`  (NN  ∈ 01..33).
//  - Exercises:           string ref keyed to entries in
//                         `catalog.exercises[].ref`
//                         (convention: kebab-case canonical name).
//  - Labels:              string ref keyed to entries in
//                         `catalog.labels[].ref` (same convention).
//  - Archetype names:     enumerated by `archetypeParamsSchema.archetype`
//                         discriminator.
//
// Date semantics:
//
//  No absolute calendar dates are stored. Each week carries
//  `weekOffsetFromTodayWeeks` ∈ Z relative to the seed-run instant; the emit
//  pipeline resolves `Week.startDate = startOfWeek(today, MONDAY) +
//  weekOffset * 7d`. One week per `Week` row, `Day.dayOfWeek` is the enum.
//
// Phase 7 examples:
//
//  Out-of-sample sessions covering professional CrossFit extensions (HR Z2 /
//  numeric pace / tempo / wave / cluster / super-set) live in
//  `phase7Examples` and are injected as one extra week at the plan tail.
//  Coverage matrix marks them with `source: "phase-7"`.

import { z } from "zod";

import {
  compoundRepDefinitionSchema,
  dayOfWeekSchema,
  intensitySchema,
  loadSchema,
  mediaReferenceSchema,
  perLimbDistributionSchema,
  repNotationSchema,
  sequenceIndicatorSchema,
  tempoModifierSchema,
  timeCapSchema,
} from "@repo/contracts/lms/_shared";
import {
  alternatingGroupRelationSchema,
  type AlternatingGroupRelation,
} from "@repo/contracts/lms/alternating-group";
import { archetypeParamsSchema } from "@repo/contracts/lms/schema";
import {
  positionSchema,
  rowKindSchema,
  schemaRowPayloadSchema,
} from "@repo/contracts/lms/schema-row";

// ──────────────────────────────────────────────────────────────────────────
// Reference IDs
// ──────────────────────────────────────────────────────────────────────────

export const blockInstanceRefSchema = z
  .string()
  .regex(/^block-\d{3}$/, "blockInstanceRef must match block-NNN (NNN ∈ 001..198)");

export const sheetRefSchema = z
  .string()
  .regex(/^sheet-\d{2}$/, "sheetRef must match sheet-NN (NN ∈ 01..33)");

export const exerciseRefSchema = z.string().min(1).max(64);
export const labelRefSchema = z.string().min(1).max(64);

// ──────────────────────────────────────────────────────────────────────────
// Enum mirrors from Prisma (kept as zod enums so JSON validates without
// pulling Prisma client into the canonical layer).
// ──────────────────────────────────────────────────────────────────────────

export const equipmentEnum = [
  "ASSAULT_BIKE",
  "ATLAS_STONE",
  "BAND",
  "BARBELL",
  "BODYWEIGHT",
  "BOX",
  "BOX_OR_SOFA",
  "DUMBBELL",
  "JUMP_ROPE",
  "KETTLEBELL",
  "MIXED",
  "PARALLEL_BARS",
  "RINGS",
  "ROW_ERG",
  "SKI_ERG",
  "SLED",
  "SOFA",
  "UNKNOWN",
  "YOKE",
] as const;
export const equipmentSchema = z.enum(equipmentEnum);
export type Equipment = z.infer<typeof equipmentSchema>;

export const movementTypeEnum = [
  "SQUAT",
  "HINGE",
  "PRESS",
  "PULL",
  "LUNGE",
  "CARRY",
  "LOCOMOTION",
  "STATIC_HOLD",
  "ROTATIONAL",
  "CARDIO_FLOW",
  "CORE",
  "COMBINED_OLYMPIC",
  "RAISE",
  "EXTENSION",
  "UNKNOWN",
] as const;
export const movementTypeSchema = z.enum(movementTypeEnum);

export const canonicalCompoundTypeEnum = [
  "ATOMIC",
  "COMPOUND_PLUS",
  "COMPOSITE_NAMED",
  "PLACEHOLDER",
  "ALTERNATIVE_OR",
] as const;
export const canonicalCompoundTypeSchema = z.enum(canonicalCompoundTypeEnum);

export const schemaKindEnum = ["ATOMIC", "HEADERLESS", "NESTED", "NAMED", "COMPOSITE"] as const;
export const schemaKindSchema = z.enum(schemaKindEnum);

export const appLevelEnum = ["DAY", "SESSION", "BLOCK"] as const;
export const appLevelSchema = z.enum(appLevelEnum);

// alternatingGroupRelationSchema imported from @repo/contracts/lms/alternating-group
// (kept here as a type alias so cross-references stay readable).
export type { AlternatingGroupRelation };

// ──────────────────────────────────────────────────────────────────────────
// Catalog entries (exercises + labels)
//
// The builder declares the catalogs in `_canonical/plan-synthetic/`. Refs are
// kebab-case canonical names. Order does not matter; the emit pipeline creates
// entities and retains the ref → cuid map for FK resolution.
// ──────────────────────────────────────────────────────────────────────────

export const exerciseCatalogEntrySchema = z.object({
  ref: exerciseRefSchema,
  canonicalName: z.string().min(1).max(120),
  primaryEquipment: equipmentSchema,
  movementTypeTagPrimary: movementTypeSchema,
  movementTypeTagSecondary: movementTypeSchema.nullable(),
  defaultDemoUrls: z.array(z.string().url()).default([]),
  canonicalCompoundType: canonicalCompoundTypeSchema,
  placeholderFlag: z.boolean(),
  movementFamily: z.string().min(1).max(60).nullable(),
  aliases: z.array(z.string().min(1)).default([]),
  notes: z.string().nullable().default(null),
});
export type ExerciseCatalogEntry = z.infer<typeof exerciseCatalogEntrySchema>;

export const labelCatalogEntrySchema = z.object({
  ref: labelRefSchema,
  name: z.string().min(1).max(120),
  applicableLevels: z.array(appLevelSchema).min(1),
  rest: z.boolean().default(false),
  notes: z.string().nullable().default(null),
});
export type LabelCatalogEntry = z.infer<typeof labelCatalogEntrySchema>;

// ──────────────────────────────────────────────────────────────────────────
// Row
//
// Mirrors Prisma `SchemaRow`. `rowPayload` is the discriminated union from
// contracts. Top-level VO fields are nullable per existing schema (they may
// be present on ANY rowKind, not only EXERCISE — coach can attach a load to
// a PLACEHOLDER row, etc).
//
// Internal references:
//
//  - `refId` (optional) — internal handle used inside the same plan for FK
//    targets (e.g. `parallel-ladders-descending.ladders[].pairedWithInnerRowId`,
//    `super-set.pairs[].schemaRows[]`). The emit pipeline resolves refId → cuid
//    at emit time. Refs are scoped to the containing block (uniqueness inside
//    one block).
// ──────────────────────────────────────────────────────────────────────────

export const rowSchema = z.object({
  refId: z.string().min(1).max(48).optional(),
  order: z.number().int().positive(),
  rowKind: rowKindSchema,
  rowPayload: schemaRowPayloadSchema,
  load: loadSchema.nullable().default(null),
  reps: repNotationSchema.nullable().default(null),
  side: perLimbDistributionSchema.nullable().default(null),
  tempo: tempoModifierSchema.nullable().default(null),
  position: positionSchema.nullable().default(null),
  sequence: sequenceIndicatorSchema.nullable().default(null),
  intensity: intensitySchema.nullable().default(null),
  media: mediaReferenceSchema.nullable().default(null),
  compoundRep: compoundRepDefinitionSchema.nullable().default(null),
  notes: z.string().max(4000).nullable().default(null),
});
export type CanonicalRow = z.infer<typeof rowSchema>;

// ──────────────────────────────────────────────────────────────────────────
// Schema (recursive — sub-schemas for nested / time-window-outer archetypes)
//
// `alternatingGroupRef`: scoped to containing block. The builder emits the
// same ref string on every member schema; the emit pipeline creates one
// AlternatingGroup entity per distinct ref and wires Schema.alternatingGroupId.
// ──────────────────────────────────────────────────────────────────────────

export type CanonicalSchemaNode = {
  refId?: string;
  order: number;
  kind: z.infer<typeof schemaKindSchema>;
  archetype: z.infer<typeof archetypeParamsSchema>;
  header: string | null;
  intensity: z.infer<typeof intensitySchema> | null;
  notes: string | null;
  alternatingGroupRef: string | null;
  alternatingGroupRelation: AlternatingGroupRelation | null;
  rows: CanonicalRow[];
  subSchemas: CanonicalSchemaNode[];
};

// Self-recursive Zod schema. The `as z.ZodType<CanonicalSchemaNode>` cast is
// the canonical Zod 3 pattern for self-referencing structures — without it
// TS can't infer the recursive output shape (default + optional combinations
// confuse the inference). The type alias above is the source of truth.
export const canonicalSchemaNodeSchema = z.lazy(() =>
  z.object({
    refId: z.string().min(1).max(48).optional(),
    order: z.number().int().positive(),
    kind: schemaKindSchema,
    archetype: archetypeParamsSchema,
    header: z.string().min(1).max(200).nullable(),
    intensity: intensitySchema.nullable(),
    notes: z.string().max(4000).nullable(),
    alternatingGroupRef: z.string().min(1).max(48).nullable(),
    alternatingGroupRelation: alternatingGroupRelationSchema.nullable(),
    rows: z.array(rowSchema),
    subSchemas: z.array(canonicalSchemaNodeSchema),
  }),
) as z.ZodType<CanonicalSchemaNode>;

// ──────────────────────────────────────────────────────────────────────────
// Block
//
// `blockInstanceRef` matches `block-NNN` (NNN ∈ 001..198). The builder emits
// one block instance per block occurrence, keeping the ref string so coverage
// assertions can track block presence.
//
// `labels[]` references catalog labels (0..N, empty = implicit block).
// ──────────────────────────────────────────────────────────────────────────

export const blockSchema = z.object({
  blockInstanceRef: blockInstanceRefSchema,
  order: z.number().int().positive(),
  labels: z.array(labelRefSchema).default([]),
  intensity: intensitySchema.nullable().default(null),
  timeCap: timeCapSchema.nullable().default(null),
  notes: z.string().max(4000).nullable().default(null),
  schemas: z.array(canonicalSchemaNodeSchema).default([]),
});
export type CanonicalBlock = z.infer<typeof blockSchema>;

// ──────────────────────────────────────────────────────────────────────────
// Session / Day / Week
//
// `sessionLabel` / `dayLabel`: single ref per `hierarchy.md` §1 + §2.
// `freezeLoadsAtCreation` defaults false (rare flag, Phase 6 D-10).
// ──────────────────────────────────────────────────────────────────────────

export const sessionSchema = z.object({
  order: z.number().int().positive(),
  label: labelRefSchema.nullable().default(null),
  notes: z.string().max(4000).nullable().default(null),
  freezeLoadsAtCreation: z.boolean().default(false),
  blocks: z.array(blockSchema).default([]),
});
export type CanonicalSession = z.infer<typeof sessionSchema>;

export const daySchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  label: labelRefSchema.nullable().default(null),
  notes: z.string().max(4000).nullable().default(null),
  sessions: z.array(sessionSchema).default([]),
});
export type CanonicalDay = z.infer<typeof daySchema>;

export const weekSchema = z.object({
  weekIndex: z.number().int().positive(),
  sheetRef: sheetRefSchema.nullable(),
  weekOffsetFromTodayWeeks: z.number().int(),
  notes: z.string().max(4000).nullable().default(null),
  days: z.array(daySchema).default([]),
});
export type CanonicalWeek = z.infer<typeof weekSchema>;

// ──────────────────────────────────────────────────────────────────────────
// Plan shell + meta + top-level
// ──────────────────────────────────────────────────────────────────────────

export const planShellSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).nullable().default(null),
  athleteName: z.string().min(1).max(120),
  totalWeeks: z.number().int().positive(),
  todayWeekIndex: z.number().int().positive(),
});
export type PlanShell = z.infer<typeof planShellSchema>;

export const metaSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string().datetime(),
  sourceRepoCommit: z.string().min(7).max(40).nullable().default(null),
  sourceSheetsRange: z.object({
    fromSheet: sheetRefSchema,
    toSheet: sheetRefSchema,
  }),
  notes: z.string().max(8000).nullable().default(null),
});

// Phase 7 examples are declared as a flat session list (they carry no week
// index — the emit pipeline appends them as a single synthetic week at the
// plan tail).
export const phase7SessionSchema = sessionSchema.extend({
  exampleId: z.enum([
    "phase-7-hr-z2-base-run",
    "phase-7-numeric-pace-row-intervals",
    "phase-7-tempo-back-squat",
    "phase-7-snatch-wave",
    "phase-7-strict-pull-up-cluster",
    "phase-7-accessory-super-set",
  ]),
  dayOfWeek: dayOfWeekSchema,
});

export const canonicalSeedSchema = z.object({
  meta: metaSchema,
  catalog: z.object({
    exercises: z.array(exerciseCatalogEntrySchema).min(1),
    labels: z.array(labelCatalogEntrySchema).min(1),
  }),
  plan: planShellSchema,
  weeks: z.array(weekSchema).min(1),
  phase7Examples: z.array(phase7SessionSchema).default([]),
});

export type CanonicalSeed = z.infer<typeof canonicalSeedSchema>;

// ──────────────────────────────────────────────────────────────────────────
// Cross-reference invariants (enforced after Zod parses; kept here as
// documented expectations for the builder).
//
//  X1. Every `exerciseRef` referenced anywhere (rowPayload, archetypeParams,
//      compoundRep, mediaReference, etc) MUST resolve in `catalog.exercises`.
//      Enforced by `assertExerciseRefsResolve` in
//      `canonical-plan/load-and-validate.ts`.
//
//  X2. Every `labelRef` referenced anywhere (day.label, session.label,
//      block.labels[]) MUST resolve in `catalog.labels`.
//
//  X3. Every `blockInstanceRef` MUST match the `block-NNN` regex. Coverage
//      matrix tracks block presence.
//
//  X4. `archetypeParams.archetype` MUST equal a `schema.kind`-compatible value
//      (e.g. n-rounds → ATOMIC, headerless archetypes → HEADERLESS, etc).
//
//  X5. `parallel-ladders-*.ladders[].pairedWithInnerRowId` and
//      `super-set.pairs[].schemaRows[]` MUST reference `rowSchema.refId`
//      values defined in the same containing schema/block. Resolved at emit
//      time by the emit pipeline.
//
//  X6. `alternatingGroupRef`: two or more schemas in the SAME block carrying
//      the SAME ref form one AlternatingGroup; `alternatingGroupRelation`
//      must be set on every member.
//
//  X7. `Day.label` references with `applicableLevels` including "DAY" SHOULD
//      hold; cross-level misassignment is allowed but coverage matrix flags
//      it as a deliberate edge case.
//
//  X8. `Week.weekOffsetFromTodayWeeks` values MUST be monotonic by
//      `weekIndex` (week N+1 offset > week N offset). Asserted at emit time.
//
//  X9. `Week.weekIndex` values MUST be 1..plan.totalWeeks, contiguous.
//      Calendar gaps are represented as Week rows with `days: []` and a notes
//      string.
//
//  X10. `meta.schemaVersion` MUST equal 1. Future shape evolution bumps
//       this and forks the emit code.
//
// Coverage matrix (separate doc `coverage-matrix.md`) tabulates per-VO-branch
// expected occurrence counts. The emit pipeline includes a coverage assertion
// test that fails the build if any branch is missing in the final seeded DB.
// ──────────────────────────────────────────────────────────────────────────
