# 0042. Drop `defaultParams` from `SchemeType` library entries

- **Status:** Accepted
- **Date:** 2026-05-08
- **Tags:** `lms`, `scheme-type`, `library`, `cleanup`, `schema`

## Context

ADR-0039 specifies the four library catalog entry types and explicitly characterises `SchemeType` as an **abstract scheme template**:

> Library entries are **abstract scheme templates**: "EMOM", "AMRAP", "Sets×Reps", "Rep Ladder", "RFT", "Chipper", "For Time", "Run Distance". Concrete instances ("EMOM 12 min", "21-15-9", "EMOM 20 / 4-min pattern × 5") are not separate entries; they are produced by filling parameters at use-time on the block.

The current `SchemeType` model carries a `defaultParams: Json?` column intended to hold a discriminated `SchemeParams` value with `kind` matching the entry's `archetypeKind`. The contracts layer enforces this match via a `refineKindMatches` Zod refine; the api-server endpoint duplicates the validation as a `ValidationError`; the admin app exposes a full `scheme-params` dispatcher form just to populate this field; the seed pre-fills it from the `defaultSchemeParams(archetypeKind)` factory; the list view shows it as a `JSON.stringify(...)` preview cell.

Audit of runtime consumers across `apps/`, `packages/`, and `prisma/seed/` shows that **no code path ever reads `schemeType.defaultParams` to seed a `PlanBlock.schemeParams`** at block creation. The plan editor that would consume it was rolled back per ADR-0037; the editor rebuild scheduled for the next iteration will compute block defaults via `defaultSchemeParams(schemeType.archetypeKind)` directly from the contracts factory, not from the library entry.

The column is therefore a dead JSON field with a heavy supporting cast: a Zod refine, a paired `ValidationError` in the endpoint, an admin sub-form per archetype, a JSON preview in the table, a corrupted-row mapper degradation path, and ~10 dedicated tests. Carrying this surface conflates abstract template identity (`name + archetypeKind`) with concrete preset realisation (`schemeParams` shape) — exactly the conflation ADR-0039 was meant to prevent. The pre-flight pre-seeding of `defaultParams` in the seed merely mirrors the code factory result; the admin UI duplicates the editor surface that will live at the block level in the next iteration.

## Decision

Remove `defaultParams` from `SchemeType` entirely. The library entry shape becomes:

```ts
{ id, name, archetypeKind, createdAt, updatedAt, deletedAt? }
```

— pure abstract reference, matching ADR-0039's stated intent.

When a `PlanBlock` is created in the editor (next iteration), the backend (or the form layer, depending on save model) will populate `block.schemeParams = defaultSchemeParams(schemeType.archetypeKind)`. The coach edits on the block thereafter. The factory in `packages/contracts/src/entities/lms/_domain/scheme-archetype.constants.ts` is the single source of truth for kind-level defaults.

### Schema diff

**`packages/api-server/prisma/schema.prisma`** — remove `defaultParams Json?` from `model SchemeType`. Database has no migrations folder per ADR-0019; applied via `pnpm --filter @repo/api-server db:reset`.

**`packages/contracts/src/entities/lms/scheme-type/scheme-type.schema.ts`** — drop:

- `KIND_MISMATCH_ISSUE`, `RefinableSchemeShape`, `refineKindMatches`.
- `defaultParams` field from `schemeTypeBaseSchema` and `createSchemeTypeBaseSchema`.
- `.refine(refineKindMatches, KIND_MISMATCH_ISSUE)` from `schemeTypeSchema`, `createSchemeTypeSchema`, `updateSchemeTypeSchema`.

**`packages/api-server/src/mappers/lms/scheme-type.mapper.ts`** — drop `parseDefaultParams` helper and the `defaultParams` field from `mapToSchemeType` return.

**`packages/api-server/src/endpoints/lms/library/scheme-type/admin.ts`** — drop:

- `defaultParams` validation (`createSchemeType` + `updateSchemeType`).
- `defaultParams` field write in create/update Prisma calls.
- Now-unused imports (`Prisma.DbNull`, `toInputJson` if no other consumers in this file).

**`apps/admin/src/modules/scheme-types/components/scheme-type-form.tsx`** — drop the `Default Params` `FormCard` and the `SchemeParamsField` import. The form collapses to a single column: `Identity` + `Classification`.

**`apps/admin/src/modules/scheme-types/views/scheme-types-edit-view/scheme-types-edit-form.tsx`** — drop the `defaultParams` line from `defaultValues`.

**`apps/admin/src/modules/scheme-types/sections/scheme-types-list-section/index.tsx`** — drop the `Default Params` table column (the JSON preview cell). Adjust remaining column widths so the table reflows naturally.

**`packages/api-server/prisma/seed/library/scheme-types.ts`** — drop the `defaultParams` field from the create call. Remove the now-unused `toInputJson` helper and the `defaultSchemeParams`/`SchemeParams` imports that fed it.

**Test impact** — delete `packages/contracts/src/entities/lms/scheme-type/scheme-type.schema.test.ts` (every test in that file targets the now-removed refine). Trim ~5 tests in `packages/api-server/src/endpoints/lms/library/scheme-type/admin.test.ts` that asserted on `defaultParams` create/update behaviour, the mismatched-kind validation, and the corrupt-row mapper degradation. Update `apps/platform/src/modules/plan-detail/lib/scheme-summary.test.ts` and `library-lookup.test.ts` mocks to remove `defaultParams` from the `SchemeType` shape.

The `apps/admin/src/modules/scheme-types/components/scheme-params/` dispatcher subtree (eight per-archetype components + shared infrastructure) **stays intact**. It will be lifted to `packages/ui/` in PR #188 to drive block-level `schemeParams` editing in the plan editor (i2). No new home today; the directory is unused by the admin form post-cleanup.

### Migration plan

The discipline-program database is non-production (memory: `feedback_discipline_db_non_prod`); ADR-0019 establishes `pnpm --filter @repo/api-server db:reset` (which runs `prisma db push --force-reset` and re-applies SQL checks) as the canonical schema-edit path. There is no `prisma/migrations/` folder.

1. Edit `schema.prisma`: remove `defaultParams Json?` from `SchemeType`.
2. Edit contracts, api-server, admin, platform tests, and seed per the diff above.
3. `pnpm --filter @repo/api-server db:generate` regenerates the Prisma client without `defaultParams`.
4. `pnpm --filter @repo/api-server db:reset && db:seed` drops and re-creates the schema with the smaller table and re-seeds the eight library entries.
5. `pnpm check-types && pnpm lint && pnpm test` verifies the global type-safety invariant.
6. Manual smoke at `/scheme-types` confirms the simplified create/edit form and the table without the JSON preview.

There is no production data to preserve and no in-flight enrollment / snapshot to migrate.

### Reversibility

**Two-way door pre-production.** The discipline-program database has no live snapshots referencing `SchemeType.defaultParams`. If this cleanup proves wrong, restoring the column is a Prisma + Zod + admin-UI revert at the same cost as removing it.

**One-way door post-production.** Once production ships without the column, restoring it would require both a schema migration and a data backfill from a different source of truth (the code factory, an audit log, or a fresh admin-curated set of presets). The cost grows with prod write volume on `lms_scheme_types`.

The decision is taken now precisely because the database is empty: removing the column is at its lowest cost. Delaying past first prod ship would compound the cost.

## Consequences

**Positive:**

- `SchemeType` becomes a pure abstract reference, matching ADR-0039's stated intent. The eight library entries are templates by name + archetype, not pre-set parameter blobs.
- The admin create/edit form simplifies to two `FormCard`s (`Identity` + `Classification`); the `Default Params` editor disappears. The list view loses a confusing JSON preview cell that exposed implementation detail to admin users.
- The `refineKindMatches` Zod refine, its paired `ValidationError`, the corrupt-row degradation path in the mapper, and ~10 supporting tests all leave the codebase. ~150 LOC of incidental complexity removed.
- The plan editor (next iteration) uses a single source of truth for kind-level defaults: `defaultSchemeParams(archetypeKind)` in contracts. No drift surface between library blob and code factory.
- The closed-archetype invariant survives unchanged; no impact on render, snapshot, or scheme-archetype semantics.

**Negative:**

- No per-template preset variants. "Tabata" and "EMOM 10" cannot live as distinct library entries with pre-baked params; they collapse to a single "EMOM" entry. If preset variants become a real coach need, they return as a separate entity (`SchemeTypePreset` or similar) — not by re-introducing the conflated field on `SchemeType`.
- The `apps/admin/src/modules/scheme-types/components/scheme-params/` subtree becomes temporarily unreachable from any active route until PR #188 lifts it to `@repo/ui` for the plan editor. Nothing depends on it during the gap, and the `dep:check` pipeline won't fail; it's deferred infrastructure rather than dead code.
- Anyone relying on the JSON preview in `/scheme-types` table for debugging loses that affordance. There is no replacement; the source of truth is the code factory.

**Neutral:**

- The factory `defaultSchemeParams(kind)` is unchanged. Existing seed shape is unchanged in `Prescription`, `PlanBlock`, snapshot tables.
- The eight library entries remain by name + archetype mapping (per `seed/library/scheme-types.ts`). The set of templates a coach picks from is unchanged in count and identity.
- The dispatcher subtree's structure (`scheme-params-none`, `scheme-params-sets-reps`, ..., `scheme-params-distance`) remains intact for the lift in PR #188. SETS_REPS form variant added in ADR-0041 / PR #185 stays.

## Alternatives considered

**A. Keep the column, hide the admin UI, populate via factory.** Auto-fill `defaultParams` at create-time from `defaultSchemeParams(archetypeKind)` factory; admin form drops the dispatcher; column stays in DB for potential future preset use-case. Rejected because (1) it leaves a half-measure: the column is dead but the surrounding plumbing (Zod refine, mapper parse path, validation, corrupt-row degradation) still has to be maintained, (2) the "potential future preset" rationale is YAGNI — if presets become real, they belong in a dedicated entity with its own coach UX.

**B. Treat `defaultParams` as preset variants — multiple entries per archetype.** "Tabata", "EMOM 10", "EMOM 20" each live as distinct `SchemeType` entries, all `archetypeKind: "EMOM_LOOP"` with different `defaultParams`. Rejected because (1) it pushes the library picker from 8 entries to 20–30+; coach-side picker UX bloats, (2) it creates a dual-source-of-truth between library preset and per-block override, (3) ADR-0039 explicitly rejects concrete realisations as library entries — preset variants are a different abstraction that, if needed, would warrant its own model and ADR.

**C. Defer cleanup until preset variants prove unneeded.** Wait for editor flow (next iteration) to surface real preset demand before cutting `defaultParams`. Rejected because the column is already heavy maintenance with zero current consumers; carrying it through the editor implementation forces every editor design decision to account for a field nobody reads. Cleanup now de-risks the editor design.

## References

- `docs/adr/0039-training-plan-library-catalog.md` — establishes `SchemeType` as abstract template; this ADR removes the `defaultParams` field that drifted from that intent.
- `docs/adr/0041-sets-reps-archetype.md` — adds the 9th archetype (SETS_REPS); unaffected by this cleanup beyond the `defaultParams` column drop.
- `docs/adr/0037-plan-editor-and-library-rollback.md` — rolled back the original editor implementation that may have consumed `schemeType.defaultParams`; the rebuild will use the contracts factory directly.
- `docs/adr/0019-...` — discipline-program DB non-prod / `db:reset` migration path.
- `docs/design/training-plan-domain.md` — Round 2 (Library) defines abstract template semantics.
- `packages/contracts/src/entities/lms/_domain/scheme-archetype.constants.ts` — `defaultSchemeParams(kind)` factory; the single source of truth for kind-level defaults post-cleanup.
- `apps/admin/src/modules/scheme-types/components/scheme-params/` — dispatcher subtree retained for PR #188 lift to `@repo/ui` (plan editor block-level schemeParams editing).
