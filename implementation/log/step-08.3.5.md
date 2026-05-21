# Step 08.3.5 — `schemas[]` + `alternatingGroups[]` read-embed in `blockSchema`

- **Date**: 2026-05-21
- **Feature-dev artifacts**: `.feature-dev/1779359228/` (research / review / tasks — `/feature small` pipeline).
- **Prompt**: `implementation/step-08.3.5/prompt.md` (planner-written 2026-05-21; spec-only, two-voice; D-8.3.5-1..8 ratified upfront).
- **Output**: `implementation/step-08.3.5/output.md` (executor self-report — 14/14 acceptance MET).

## Summary

The block read surface — `blockSchema` widened with `schemas: SchemaWithBody[]` (a recursive depth-2 embed) and the sibling `alternatingGroups: AlternatingGroup[]` embed, so the week read path returns each block with its full schema tree. The structural twin of Step 7.3.5 (Block embed into the week response), one level deeper. After 8.3.5 the block read surface is complete end-to-end (contracts → api-server → the week read); Step 8.4 renders schemas inside blocks straight off `useWeek`.

**1 squash commit + output report** (`2ee659cd..0688cc0a`, base the prompt commit `c80e18c7`):

1. `2ee659cd feat(training-domain): embed schemas and alternating groups in block read` — cross-package squash (12 code/test files, +675/−18): `@repo/contracts` (recursive `schemaWithBodySchema`, `blockSchema` widened) + `@repo/api-server` (`mapToBlockWithSchemas`, `mapToBlock` widened, `mapToSessionWithLabelAndBlocks` switched, `week/admin.ts` include + `DAY_INCLUDE` widened) + contract & api-server tests.
2. `0688cc0a docs(step-08.3.5): write executor output report`.

**12 code/test files, 0 created** — purely additive. Cross-package squash per `[[husky-cross-package-squash]]`: a `@repo/contracts`-first commit leaves `mapToBlock` missing the new fields → `turbo check-types --filter="...[HEAD]"` red; no green intermediate ordering → 1 commit with a per-layer body (mirror Step 7.3.5 `b8a6982f`).

**Planner spot-check** (verbatim `git show 2ee659cd`):

- **Both includes widened identically** — `week/admin.ts` inline + `day/admin.ts` `DAY_INCLUDE` carry the same depth-2 `schemas` sub-tree (top-level `where: { parentSchemaId: null }`, `subSchemas` via the self-relation, `rows` at both levels, `orderBy: { order: "asc" }` at every level) + `alternatingGroups: { include: { schemas: { select: { id: true } } } }`; the only difference is `DAY_INCLUDE`'s pre-existing `as const`. The Step 7.3.5 D-1 dual-consumer recurrence (the load-bearing D-8.3.5-4 trap) is averted.
- `mapToBlockWithSchemas` extends `mapToBlockWithLabels` (D-8.3.5-4); the depth-2 tree is assembled via a shared `mapToSchemaWithBody` helper (`subSchemas: []` floor, overridden one level for the top-level schemas) composing `mapToSchema` / `mapToSchemaRow` / `mapToAlternatingGroup`.
- `mapToBlock` += `schemas: []` / `alternatingGroups: []` (the `labels: []` partial-population idiom); `mapToBlockWithLabels` / `block/admin.ts` byte-identical.
- `schemaWithBodySchema` — recursive `z.lazy` + explicit `z.ZodType<SchemaWithBody>`, mirroring `schemaSchema`'s declaration form.
- `block-api.schema.ts` / `day.schema.ts` / `week-api.schema.ts` / all barrels — byte-identical (auto-widen via `blockSchema` references; wildcard barrels).
- scope confined: `git diff c80e18c7..HEAD` is only `packages/contracts/.../{schema,block,day}/` + `packages/api-server/.../{mappers/lms,endpoints/lms/{week,day}}/` + `step-08.3.5/output.md`; `apps/*`, Prisma schema, seed, `analysis/`, `apps/admin` — 0 lines.

Verifications (planner re-ran `pnpm check-types` — 16/16, FULL TURBO): `pnpm check-types` 16/16 · `pnpm lint` 16/16 (0 warnings) · `pnpm test` 1691/1691 (132 files; +11 over the 1680 baseline; the QA-023 `block/admin.test.ts:406` timing flake did not reproduce in the final run) · `pnpm dep:check` 0 violations, no new cycle. Husky clean on both commits; zero `--no-verify` / `--no-edit` / `--no-gpg-sign`. `/feature small` Stage 5 Review-Light **APPROVED** (0 CRITICAL / 0 WARNING / 1 INFO — REVIEW-INFO-1, the expected test-stage red, closed by Stage 4).

## Open questions resolved

Two executor OQs, both resolved within the ratified intent — no planner escalation:

- **OQ-1 — D-8.3.5-2 wiring deviation (sound).** The prompt's literal D-8.3.5-2 wording (`SchemaWithBody = z.infer<typeof schemaWithBodySchema>`, mirroring `Schema = z.infer<typeof schemaSchema>`) does not compile: a recursive schema annotated `z.ZodType<T>` cannot have `T` be its own `z.infer` (circular), and the `SchemaShape`-style local-unexported structural type works only for a _non-recursive_ type — a recursive structural type's name cannot be inlined by TS, so an unexported one leaks `TS4023` through `blockSchema`'s inferred type into `block-api.schema.ts` / `day.schema.ts` / `week-api.schema.ts`. Resolution: `SchemaWithBody` is declared once, exported, in `schema.schema.ts` (next to the schema it annotates — as `SchemaShape` lives there); `schemaWithBodySchema: z.ZodType<SchemaWithBody>` is pinned to it (drift impossible — any field mismatch fails `tsc`); `schema.types.ts` re-exports it (`export { type SchemaWithBody } from "./schema.schema"` — the old hand-written duplicate deleted). The D-8.3.5-2 intent — one canonical definition, zero drift — is preserved; only the spelling differs. The canonical Zod recursive-schema pattern. Review-Light verified sound (incl. an empirical probe — the dual-path barrel re-export of the _same_ `SchemaWithBody` symbol raises no `TS2308`).
- **OQ-2 — negative-guard retirement.** `block.schema.test.ts` carried `it("does not expose schemas (Step 8 surface; regression guard)")` — a guard whose sole purpose was to assert `blockSchema` lacks `schemas` _until Step 8 adds it_. 8.3.5 _is_ that step → the guard was deleted (not amended — a "not present" assertion has no "present" amendment), replaced with two positive cases (empty embed + populated embed). The sibling `not.toHaveProperty("name")` guard is kept (8.3.5 adds no `name`). Flagged at Research-Light, executed cleanly.

## Deviations

**14/14 acceptance MET.** No structural deviation — `mapToBlockWithSchemas` assembled per § 3.2, both includes widened identically, no out-of-scope file touched. One spelling deviation from the literal D-8.3.5-2 (OQ-1 above) — intent preserved, Review-Light-verified sound. `lint --fix` (prettier) cosmetically collapsed a few expressions — no semantic change.

## Analysis-artifacts touched

None — 8.3.5 is a read-shape widening of existing entity relations; no domain-semantics change, no Prisma schema change (`SchemaWithBody` already existed in `06-formalization/types.ts`). Mirror Step 7.3.5 ("Analysis/-files touched: none").

## Smoke-test status

**N/A** — no runtime UI; the embed is verified by contract + api-server tests. UI smoke resumes at the Step 8.4 anchor.

## Process note

**Validation verdict: clean — Review-Light APPROVED, all gates green (planner re-ran `check-types` 16/16), the load-bearing traps confirmed verbatim: the dual-include widened identically (D-8.3.5-4 — the Step 7.3.5 D-1 recurrence averted), `where: { parentSchemaId: null }` present in both includes, the depth-2 tree + `orderBy` at every level, `alternatingGroups` carrying `{ id }`-selected members (not bare `true`), `mapToBlockWithSchemas` with the `subSchemas: []` floor — scope confined.** Step accepted. Zero escalations — both executor OQs resolved within the ratified intent.

**Planner-discipline note — flavour (i) `[[planner-lint-impact-trace]]` adjacent refinement.** The prompt § 0.3 / § 3.1 pointed the recursive `schemaWithBodySchema`'s structural type at the `SchemaShape` precedent ("the structural `Shape` type local to `schema.schema.ts` as `SchemaShape` is"). `SchemaShape` is non-recursive, so it works local-unexported; a _recursive_ structural type cannot — TS must name the recursion point, and an unexported name leaks `TS4023`. The prompt nonetheless carried the D-8.3.5-2 _intent_ correctly (§ 0.4 — "one canonical definition ... do not leave a separate hand-written definition that can drift"), so the executor resolved the spelling within that intent — no wrong outcome, no escalation, the exact type-mechanics correctly left to the executor per `[[planner-strategic-level]]`. The narrow lesson: when a prompt points a recursive type at a non-recursive precedent, note that the recursion changes the export requirement. Adjacent refinement of flavour (i); not a new flavour, not memory-worthy on its own.

**Next planner action**: Step 8.3.6 — `SchemaRow @@unique([schemaId, order])` + the `lmsSchemaRowApi.reorder` two-pass rewrite (a Prisma constraint step, mirror Step 7.3.6). See `state/04-next-action.md`.
