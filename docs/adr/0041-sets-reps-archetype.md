# 0041. Sets × Reps as a first-class scheme archetype

- **Status:** Accepted
- **Date:** 2026-05-08
- **Tags:** `lms`, `scheme-archetype`, `domain`, `schema`

## Context

ADR-0038 established the four-level plan tree (`PlanDay → PlanSession → PlanBlock → PlanItem`) and the closed `SchemeArchetypeKind` enum that drives UI rendering and parameter-shape validation. ADR-0039 specified the eight library SchemeType templates that ship at MVP — `EMOM`, `AMRAP`, `For Time`, `Interval Loop`, `EMOM`, `Time-Boxed`, `Rep Ladder`, `Distance Run`, and `Sets × Reps`. Seven of those eight map to a parameterized archetype (`COUNT_UP`, `COUNT_DOWN`, `INTERVAL_LOOP`, `EMOM_LOOP`, `TIME_BOXED`, `LADDER`, `DISTANCE`). The eighth — `Sets × Reps` — was assigned `archetypeKind = NONE`, the parameterless variant intended as a catch-all for "plain composition / accessory list".

The coach plan editor iteration 1 (PR #184) shipped a read-only week view rendering the seeded fixtures. Manual smoke surfaced the gap: a Strength block prescribed as "5 × Front Squat 3 reps @ 90 kg" rendered as "Sets × Reps · Front Squat 3 · BB 90kg". The number of sets is missing because the data model has nowhere to put it:

- `Prescription` (per item) carries `reps`, `durationSec`, `distanceM`, `calories`, `load`, `tempo`, `sideMode`, `composition`, `modifiers`, `scalingNotes` — no `sets`.
- `SchemeParams.NONE = { kind: "NONE" }` — parameterless by design, no `sets` slot.
- `PlanBlock` has structural fields (`blockTypeIds[]`, `schemeTypeId`, `schemeParams`, `weight`, `modifiers`) — no top-level `sets`.

The reference coach's 33-week home-equipment programming PDF (the empirical dataset behind ADR-0038's "38 distinct patterns") treats sets × reps as one of the workhorse block-level scheme patterns. It is a recurring shape, not an edge case. Without a canonical home for the set count, the most common Strength prescription in the corpus does not round-trip from coach intent through schema to UI.

## Decision

Promote sets × reps to a first-class scheme archetype. Extend `SchemeArchetypeKind` from eight kinds to nine, add a discriminated `SETS_REPS` variant to `SchemeParams`, and re-map the existing `Sets × Reps` library entry to the new archetype.

### Schema diff

**`packages/contracts/src/entities/lms/_domain/scheme-archetype.schema.ts`**

Extend the closed enum:

```ts
export const schemeArchetypeKindSchema = z.enum([
  "NONE",
  "SETS_REPS",
  "COUNT_UP",
  "COUNT_DOWN",
  "INTERVAL_LOOP",
  "EMOM_LOOP",
  "TIME_BOXED",
  "LADDER",
  "DISTANCE",
]);
```

Add the variant to the discriminated `schemeParamsSchema`:

```ts
export const schemeParamsSetsRepsSchema = z.object({
  kind: z.literal("SETS_REPS"),
  sets: z.number().int().positive(),
  progression: z.array(progressionStepSchema).optional(),
});

export const schemeParamsSchema = z.discriminatedUnion("kind", [
  schemeParamsNoneSchema,
  schemeParamsSetsRepsSchema,
  schemeParamsCountUpSchema,
  // ...
]);
```

`progressionStepSchema` already exists (used by `COUNT_UP` and `COUNT_DOWN`); reused unchanged.

**`packages/contracts/src/entities/lms/_domain/scheme-archetype.constants.ts`**

Extend `SCHEME_ARCHETYPE_KINDS`, `SCHEME_ARCHETYPE_KIND_LABELS`, `defaultSchemeParams`:

```ts
export const SCHEME_ARCHETYPE_KIND_LABELS: Record<SchemeArchetypeKind, string> = {
  NONE: "None",
  SETS_REPS: "Sets × Reps",
  COUNT_UP: "Count Up",
  // ...
};

export function defaultSchemeParams(kind: SchemeArchetypeKind): SchemeParams {
  switch (kind) {
    case "NONE":
      return { kind: "NONE" };
    case "SETS_REPS":
      return { kind: "SETS_REPS", sets: 3 };
    // ...
  }
}
```

**`packages/api-server/prisma/schema.prisma`**

`SchemeArchetypeKind` enum gains `SETS_REPS` between `NONE` and `COUNT_UP`. Database has no migrations folder (ADR-0019); applied via `pnpm --filter @repo/api-server db:reset`.

**`Prescription` shape** is left unchanged. `Prescription.reps` remains the per-item rep count (`{ kind: FIXED, value: 3 }` for "3 reps per set"). The new `SchemeParams.SETS_REPS.sets` lives at block level — orthogonal axis.

### Semantics

- **Block-level `sets`:** the number of times the block's items are performed as a group. "5 × (Front Squat 3 + Pull-up 8)" is `SchemeParams = { kind: SETS_REPS, sets: 5 }` with two items, each carrying its own `Prescription.reps`.
- **Per-item `reps`:** the rep count within a single set. `Prescription.reps = { kind: FIXED, value: 3 }` reads as "3 reps per set", not "3 reps total".
- **`progression?: ProgressionStep[]`:** optional per-set variation, reusing the existing `progressionStepSchema` shape (`{ round, reps?, loadOverride?, modifier? }`). Coach uses this for "5 × @ 70/80/85/85/85 %" patterns. Empty / undefined means uniform sets.
- **Single-item simple case:** "5 × Front Squat 3 @ 90 kg" is one item, `Prescription.reps = { kind: FIXED, value: 3 }`, `SchemeParams = { kind: SETS_REPS, sets: 5 }`. Block render: `Sets × Reps · 5 sets`. Item render: `Front Squat 3 · BB 90kg`. The two coordinates compose: 5 sets × (the item's per-set work).
- **Superset / paired case:** "5 × (Front Squat 3 reps + Pull-up 8 reps)" is two items, each with its own `Prescription.reps`, `SchemeParams = { kind: SETS_REPS, sets: 5 }`. Block render: `Sets × Reps · 5 sets`. Items render: `Front Squat 3 · BB 90kg`, `Pull-up 8`.
- **Variable-load progression:** "5 × @ 70/80/85/85/85 %" is `SchemeParams = { kind: SETS_REPS, sets: 5, progression: [{ round: 1, loadOverride: { kind: PERCENT_BENCHMARK, percent: 70, ... } }, ...] }`. Same shape as `COUNT_UP.progression` — coach learning surface is uniform across archetypes.

### Migration plan

The discipline-program database is non-production (memory: `feedback_discipline_db_non_prod`); ADR-0019 establishes `pnpm --filter @repo/api-server db:reset` (which runs `prisma db push --force-reset` and then re-applies SQL checks) as the canonical schema-edit path. There is no `prisma/migrations/` folder.

Migration steps for PR #185:

1. Edit `packages/api-server/prisma/schema.prisma`: add `SETS_REPS` to the `SchemeArchetypeKind` enum.
2. Edit `packages/contracts/src/entities/lms/_domain/scheme-archetype.schema.ts`: extend the Zod enum and discriminated union.
3. Edit `packages/contracts/src/entities/lms/_domain/scheme-archetype.constants.ts`: extend the kind list, label map, and `defaultSchemeParams` factory.
4. Run `pnpm --filter @repo/api-server db:generate` to regenerate the Prisma client with the updated enum.
5. Run `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed` to drop and re-create the schema with the new enum value, then re-seed with the migrated fixtures.
6. Verify Prisma type-check succeeds across packages and the platform / admin builds compile.

There is no production data to preserve and no in-flight enrollment / snapshot to migrate. The seed re-creates everything from scratch.

### Render impact

**`apps/platform/src/modules/plan-detail/lib/scheme-summary.ts` — `formatSchemeSummary`:**

Add a `case "SETS_REPS"` branch in the switch over `params.kind`:

```ts
case "SETS_REPS":
  return `${name}${SUMMARY_SEPARATOR}${params.sets} ${pluralize(params.sets, "set")}`;
```

Block-level summary becomes `Sets × Reps · 5 sets`. Per-set progression hint (e.g. `· progression`) is deferred until coaches request it; the explicit per-step list belongs in the block-detail panel, not in the one-line summary.

**`apps/platform/src/modules/plan-detail/lib/prescription-summary.ts` — `formatPrescriptionSummary`:**

Unchanged. Per-item rendering remains `<reps> · <load> · <tempo> · <sideMode>`. The block-level set count is rendered by `formatSchemeSummary`, not duplicated per item.

**`apps/admin/src/modules/scheme-types/components/scheme-params/`:**

Add `scheme-params-sets-reps.tsx` by analogy with `scheme-params-count-up.tsx` (the closest sibling — both have `progression` as an optional field array). Two top-level fields: `sets` (positive integer input) and `progression` (optional `ProgressionStep[]` field array reusing `progression-step-row.tsx` and `use-primitive-field-array.ts`).

Wire into `scheme-params-field.tsx` dispatcher: route `kind === "SETS_REPS"` to the new component.

**Tests:**

- `scheme-summary.test.ts`: add cases for `SETS_REPS` (uniform 5 sets, single-set edge case `sets: 1`, larger sets `sets: 12`, with and without progression — render is the same one-line summary).
- `scheme-archetype.constants.test.ts` (or wherever `defaultSchemeParams` is tested): add the `SETS_REPS` branch.
- `prescription-summary.test.ts`: untouched (per-item shape did not change).

### Seed impact

**`packages/api-server/prisma/seed/library/scheme-types.ts` (line 16):**

Re-map the `Sets × Reps` library entry from `archetypeKind: NONE` to `archetypeKind: SETS_REPS`:

```ts
{ name: "Sets × Reps", archetypeKind: SchemeArchetypeKind.SETS_REPS },
```

`defaultParams` is automatically `{ kind: SETS_REPS, sets: 3 }` via the `defaultSchemeParams` factory.

**`packages/api-server/prisma/seed/plan-content/`:**

Strength blocks across the four plan fixtures need their `schemeParams` re-bodied from `{ kind: NONE }` to `{ kind: SETS_REPS, sets: <N> }` with the appropriate set count (currently expressed implicitly through the number of items or hard-coded reps). Files to touch:

- `foundations-gpp.ts` — opening Strength blocks (Front Squat / Press / Deadlift fixtures).
- `the-competitor-current-week.ts` — current-week Strength blocks (the visible fixture set referenced by manual smoke testing).
- `the-competitor-history.ts` — historical Strength blocks (if any).
- `the-competitor-future.ts` — forward Strength blocks.

The pattern: replace per-item duplication ("5 identical items each with `reps: { kind: FIXED, value: 3 }`") with a single item plus `block.schemeParams.sets = 5`. Manually inspect each Strength block during the seed migration; some may genuinely have 5 distinct items (working sets with varying loads), in which case `progression` carries the per-set load variation and items collapse to one.

The migration is hand-authored and not mechanized. Estimated touches: ~10–15 blocks across the four files.

### Reversibility

**Two-way door pre-production.** The discipline-program database is non-prod and has no live snapshots. If `SETS_REPS` proves unworkable in PR #185 review, retracting the archetype is a Zod / Prisma enum revert plus seed rollback — same ergonomics as adding it.

**One-way door post-production.** Once snapshots reference `SETS_REPS` in `BlockSession.schemeArchetypeKind`, retraction becomes lossy: the historical record cannot be retroactively re-shaped without rewriting frozen snapshots, which violates ADR-0040. After production data exists the archetype is additive-only — deprecation is possible (mark it `@deprecated` in the Zod enum, stop the admin UI from offering it for new SchemeTypes), permanent removal is not.

The decision is taken now precisely because the database is empty: the cost of adding the archetype is at its lowest. Delaying past first prod ship would compound the cost.

## Consequences

**Positive:**

- The eight library SchemeType templates are now uniformly parameterized: every named template maps to a real archetype contract. The library is internally consistent.
- Block-level `sets` matches the coach's mental model. "5 × (...)" is one number on the block, not duplicated across items. Supersets and paired exercises round-trip from intent to schema without forced restructuring.
- Per-set progression (`progression?`) is available immediately, free, by reusing the existing `progressionStepSchema`. Coaches can express "5 × @ 70/80/85/85/85 %" without a follow-up archetype.
- The closed enum invariant is preserved. Extension goes through the established channel — code PR, discriminated union update, exhaustive switch coverage. No new escape hatch (e.g. `SchemeParams.NONE` continues to mean "no parameters", not "unspecified parameters").
- The `formatSchemeSummary` function gains a real case for `SETS_REPS`. The previous gap (`NONE` rendering only the scheme name) is replaced with a surface that conveys the prescription. UI honesty improves.
- Render path becomes unambiguous: block summary owns the set count, item summary owns per-set work. No need to special-case rendering when `Sets × Reps` is the scheme — the dispatcher in `formatSchemeSummary` handles it like any other archetype.

**Negative:**

- Eight archetypes become nine. Every exhaustive-switch site (the dispatcher in `scheme-params-field.tsx`, the renderer in `formatSchemeSummary`, the factory in `defaultSchemeParams`, the parsers in `seed/scheme-types.ts`) gains a branch. The TypeScript compiler enforces exhaustiveness, so the cost is mechanical, but it is real cost.
- Existing seed fixtures must be hand-migrated. The migration is mechanical but not trivial — each Strength block needs inspection to determine whether the current "duplicated items" representation is genuine multi-item work or a per-item-fan-out hack for missing block-level sets. Estimated 1–2 hours.
- The closed-enum extension is one-way post-prod. Once prod ships, retracting `SETS_REPS` is not possible without rewriting snapshots. The decision must be right; this ADR commits to it on the strength of the reference coach data and the eight-template library catalog rationale.

**Neutral:**

- `SchemeParams.NONE` survives unchanged. It continues to mean "no parameters needed" for genuinely structure-less blocks (free-form composition, accessory list, warm-up containers). Sets × Reps moves out; nothing else moves in.
- `Prescription.sets` is _not_ added. The decision keeps per-item shape stable. Sets are exclusively a block-level concept under this ADR.
- The `Sets × Reps` SchemeType library entry name is unchanged. Only its `archetypeKind` and `defaultParams` change. Coaches currently selecting it from the picker continue to see the same name in the dropdown.
- Snapshot tier is unaffected at the schema level — `BlockSession.schemeArchetypeKind` and `BlockSession.schemeParamsSnapshot` already accept any variant of the discriminated union. New variant flows through unchanged.

## Alternatives considered

**A. Extend `Prescription` with `sets?: number`.** Add a per-item set count. Minimal schema change, additive optional. Rejected because (1) it forces per-item duplication for the simple case (every item carries the same `sets` value), (2) it breaks the superset semantic — two items each with `sets: 5` reads as "10 sets total" rather than "5 supersets", (3) the `Sets × Reps` library SchemeType remains a label-only marker rather than a parameterized template, breaking the symmetry with the other seven library entries, and (4) it doubles down on `NONE` as a catch-all rather than admitting a specific archetype for the most common pattern.

**B. Repurpose `COUNT_UP` with `rounds` and no `cap`.** Coach selects `Sets × Reps` from the library, the library entry maps to `COUNT_UP`, the coach fills `rounds: 5` and leaves `cap` undefined. Zero schema change. Rejected because (1) `COUNT_UP` is AMRAP-shape ("count up to a goal, optionally capped by time"); using it for fixed-rounds Strength is a semantic shoehorn, (2) the rendering path for `COUNT_UP` would need a special case ("if `rounds` set and `cap` unset, render as `<rounds> sets`") — exactly the special-casing that discriminated unions exist to prevent, (3) the admin UI would label this scheme `Count Up` while the coach sees `Sets × Reps` in the library — two names for one thing, (4) future archetype-specific behavior (e.g. per-set progression UI tailored to `SETS_REPS`) becomes impossible without adding a second discriminator on top of `kind`.

**C. Defer to a follow-up after i2.** Ship the editor mutations + save model first with `Sets × Reps` continuing to map to `NONE`, then add the archetype later. Rejected because the editor must be able to round-trip the archetype the coach selects; shipping with a known semantic gap means coaches build Strength blocks against a contract that will change under them. The fix is small (~0.5–2 days), the cost of shipping the editor on a leaky model is much larger.

## References

- `docs/adr/0038-training-plan-domain.md` — establishes the closed `SchemeArchetypeKind` enum and the eight-template library catalog.
- `docs/adr/0039-training-plan-library-catalog.md` — enumerates the eight library SchemeType templates and their intended archetype mapping. This ADR refines the `Sets × Reps` row of that mapping.
- `docs/adr/0040-training-plan-snapshot-and-analytics.md` — snapshot tier accepts any `schemeParams` variant; no schema delta in the snapshot tables.
- `docs/design/training-plan-domain.md` — Round 2 (Library) lists the eight templates and the reference coach 33-week PDF coverage table validating sets × reps as a workhorse pattern.
- `packages/contracts/src/entities/lms/_domain/scheme-archetype.schema.ts` — current eight-archetype Zod definition.
- `packages/contracts/src/entities/lms/_domain/prescription.schema.ts` — current `Prescription` shape (unchanged by this ADR).
- `apps/platform/src/modules/plan-detail/lib/scheme-summary.ts` — render switch that gains a `SETS_REPS` branch in PR #185.
- `apps/admin/src/modules/scheme-types/components/scheme-params/` — admin editor dispatcher that gains `scheme-params-sets-reps.tsx` in PR #185.
- `packages/api-server/prisma/seed/library/scheme-types.ts` — library SchemeType seed entries; `Sets × Reps` re-mapped from `NONE` to `SETS_REPS` in PR #185.
