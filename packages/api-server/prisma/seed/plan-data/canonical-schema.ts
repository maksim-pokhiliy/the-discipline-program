// Canonical shape for the Demo Plan seed pipeline.
//
// This schema defines the canonical Demo Plan structure. The plan is produced
// by the typed builder in `plan-data/builder/` and assembled in
// `plan-data/plan-synthetic/` as a fully-typed `SYNTHETIC_DEMO_PLAN` const.
// It is validated by `canonicalSeedSchema` at seed time in
// `plan-emit/load-and-validate.ts`, then written to Prisma by the emit
// chain (catalog → plan → blocks → schemas → rows).
//
// DRY policy: every VO / composition-axis / row-payload schema is imported
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
//  numeric pace / tempo / wave / cluster) live in `phase7Examples` and are
//  injected as one extra week at the plan tail. Coverage matrix marks them
//  with `source: "phase-7"`.

import { z } from "zod";

import {
  dayOfWeekSchema,
  intensitySchema,
  loadSchema,
  mediaReferenceSchema,
  notesListSchema,
  perLimbDistributionSchema,
  repNotationSchema,
  tempoModifierSchema,
} from "@repo/contracts/lms/_shared";
import { compositionSchema } from "@repo/contracts/lms/composition";
import { PARALLEL_INTERLEAVE_ORDERS } from "@repo/contracts/lms/schema-group";

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

export const appLevelEnum = ["DAY", "SESSION", "BLOCK"] as const;
export const appLevelSchema = z.enum(appLevelEnum);

// ──────────────────────────────────────────────────────────────────────────
// Catalog entries (exercises + labels)
//
// The builder declares the catalogs in `plan-data/plan-synthetic/`. Refs are
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

export const modifierRefSchema = z.string().min(1).max(64);

export const modifierCatalogEntrySchema = z.object({
  ref: modifierRefSchema,
  name: z.string().min(1).max(200),
  notes: notesListSchema.nullable().default(null),
});
export type ModifierCatalogEntry = z.infer<typeof modifierCatalogEntrySchema>;

// ──────────────────────────────────────────────────────────────────────────
// Row
//
// Mirrors Prisma `SchemaRow`. The row is ALWAYS an exercise (one row kind —
// D-ROW-GRAMMAR); `exerciseId` is a catalog ref resolved to a cuid at emit
// time. `modifierRefs` reference the modifier catalog (ordered). Row-group
// membership is expressed by the schema node's `rowGroups` (member refIds).
// ──────────────────────────────────────────────────────────────────────────

const rowSchemaDef = z.object({
  refId: z.string().min(1).max(48).optional(),
  order: z.number().int().positive(),
  exerciseId: exerciseRefSchema,
  sets: z.number().int().positive().nullable().default(null),
  load: loadSchema.nullable().default(null),
  reps: repNotationSchema.nullable().default(null),
  side: perLimbDistributionSchema.nullable().default(null),
  tempo: tempoModifierSchema.nullable().default(null),
  media: mediaReferenceSchema.nullable().default(null),
  modifierRefs: z.array(modifierRefSchema).default([]),
  notes: notesListSchema.nullable().default(null),
});

export type CanonicalRow = z.infer<typeof rowSchemaDef>;
export const rowSchema: z.ZodType<
  CanonicalRow,
  z.ZodTypeDef,
  z.input<typeof rowSchemaDef>
> = rowSchemaDef;

// ──────────────────────────────────────────────────────────────────────────
// Row group
//
// Mirror of `CanonicalSchemaGroup` one floor down. A schema-owned box wrapping
// CONTIGUOUS member rows (2+) identified by their `refId`. Carries an ordered
// notes stack (the opaque box label is the first note — D-FLOORS). The emit
// pipeline writes a `RowGroup` row and sets `SchemaRow.rowGroupId` on the
// member rows resolved by refId.
// ──────────────────────────────────────────────────────────────────────────

export const canonicalRowGroupSchema = z.object({
  refId: z.string().min(1).max(48),
  notes: notesListSchema.nullable().default(null),
  memberRowRefIds: z.array(z.string().min(1).max(48)).min(2),
});
export type CanonicalRowGroup = z.infer<typeof canonicalRowGroupSchema>;

const canonicalSchemaNodeSchemaDef = z.object({
  refId: z.string().min(1).max(48).optional(),
  order: z.number().int().positive(),
  composition: compositionSchema,
  header: z.string().min(1).max(200).nullable(),
  intensity: intensitySchema.nullable(),
  notes: notesListSchema.nullable(),
  rows: z.array(rowSchema),
  rowGroups: z.array(canonicalRowGroupSchema).default([]),
});

export type CanonicalSchemaNode = z.infer<typeof canonicalSchemaNodeSchemaDef>;
export const canonicalSchemaNodeSchema: z.ZodType<
  CanonicalSchemaNode,
  z.ZodTypeDef,
  z.input<typeof canonicalSchemaNodeSchemaDef>
> = canonicalSchemaNodeSchemaDef;

// ──────────────────────────────────────────────────────────────────────────
// Block schema item
//
// A block's `schemas` list holds items that are EITHER a plain schema node OR
// an explicit group of ≥1 member schema nodes (`{ group: {...} }`). A group
// carries an opaque label the system NEVER interprets + an optional
// interleaveOrder display setting. Membership is the only sibling relation:
// the emit pipeline writes a `SchemaGroup` row and assigns its members
// CONTIGUOUS orders within the block. Plain nodes stay UNWRAPPED — only the
// group form is tagged, keeping authoring ergonomics for the common case.
// ──────────────────────────────────────────────────────────────────────────

export const canonicalSchemaGroupSchema = z.object({
  notes: notesListSchema.nullable(),
  interleaveOrder: z.enum(PARALLEL_INTERLEAVE_ORDERS).optional(),
  members: z.array(canonicalSchemaNodeSchema).min(1),
});
export type CanonicalSchemaGroup = z.infer<typeof canonicalSchemaGroupSchema>;

export const canonicalGroupItemSchema = z.object({ group: canonicalSchemaGroupSchema }).strict();
export type CanonicalGroupItem = z.infer<typeof canonicalGroupItemSchema>;

export const canonicalBlockSchemaItemSchema = z.union([
  canonicalSchemaNodeSchema,
  canonicalGroupItemSchema,
]);
export type CanonicalBlockSchemaItem = z.infer<typeof canonicalBlockSchemaItemSchema>;

export const isCanonicalGroupItem = (item: CanonicalBlockSchemaItem): item is CanonicalGroupItem =>
  "group" in item;

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
  notes: notesListSchema.nullable().default(null),
  schemas: z.array(canonicalBlockSchemaItemSchema).default([]),
});
export type CanonicalBlock = z.infer<typeof blockSchema>;

// ──────────────────────────────────────────────────────────────────────────
// Session / Day / Week
//
// `sessionLabel` / `dayLabel`: single ref per `hierarchy.md` §1 + §2.
// ──────────────────────────────────────────────────────────────────────────

export const sessionSchema = z.object({
  order: z.number().int().positive(),
  label: labelRefSchema.nullable().default(null),
  notes: notesListSchema.nullable().default(null),
  blocks: z.array(blockSchema).default([]),
});
export type CanonicalSession = z.infer<typeof sessionSchema>;

export const daySchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  label: labelRefSchema.nullable().default(null),
  notes: notesListSchema.nullable().default(null),
  sessions: z.array(sessionSchema).default([]),
});
export type CanonicalDay = z.infer<typeof daySchema>;

export const weekSchema = z.object({
  weekIndex: z.number().int().positive(),
  sheetRef: sheetRefSchema.nullable(),
  weekOffsetFromTodayWeeks: z.number().int(),
  notes: notesListSchema.nullable().default(null),
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

const canonicalSeedSchemaDef = z.object({
  meta: metaSchema,
  catalog: z.object({
    exercises: z.array(exerciseCatalogEntrySchema).min(1),
    labels: z.array(labelCatalogEntrySchema).min(1),
    modifiers: z.array(modifierCatalogEntrySchema).default([]),
  }),
  plan: planShellSchema,
  weeks: z.array(weekSchema).min(1),
  phase7Examples: z.array(phase7SessionSchema).default([]),
});

export type CanonicalSeed = z.infer<typeof canonicalSeedSchemaDef>;

export const canonicalSeedSchema: z.ZodType<
  CanonicalSeed,
  z.ZodTypeDef,
  z.input<typeof canonicalSeedSchemaDef>
> = canonicalSeedSchemaDef;

// ──────────────────────────────────────────────────────────────────────────
// Cross-reference invariants (enforced after Zod parses; kept here as
// documented expectations for the builder).
//
//  X1. Every `exerciseRef` referenced anywhere (row.exerciseId,
//      mediaReference, etc) MUST resolve in `catalog.exercises`. Enforced by
//      `assertExerciseRefsResolve` in `plan-emit/load-and-validate.ts`.
//
//  X2. Every `labelRef` referenced anywhere (day.label, session.label,
//      block.labels[]) MUST resolve in `catalog.labels`.
//
//  X3. Every `blockInstanceRef` MUST match the `block-NNN` regex. Coverage
//      matrix tracks block presence.
//
//  X4. A group's members are written on CONTIGUOUS block orders at emit time;
//      a `SchemaGroup` row owns them via `Schema.groupId`. Membership is the
//      only sibling relation — no sibling→sibling references.
//
//  X5. `Day.label` references with `applicableLevels` including "DAY" SHOULD
//      hold; cross-level misassignment is allowed but coverage matrix flags
//      it as a deliberate edge case.
//
//  X6. `Week.weekOffsetFromTodayWeeks` values MUST be monotonic by
//      `weekIndex` (week N+1 offset > week N offset). Asserted at emit time.
//
//  X7. `Week.weekIndex` values MUST be 1..plan.totalWeeks, contiguous.
//      Calendar gaps are represented as Week rows with `days: []` and a notes
//      string.
//
//  X8. `meta.schemaVersion` MUST equal 1. Future shape evolution bumps
//      this and forks the emit code.
//
// Coverage matrix (separate doc `coverage-matrix.md`) tabulates per-VO-branch
// expected occurrence counts. The emit pipeline includes a coverage assertion
// test that fails the build if any branch is missing in the final seeded DB.
// ──────────────────────────────────────────────────────────────────────────
