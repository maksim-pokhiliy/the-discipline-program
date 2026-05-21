# Step 08.3 — Platform client API + TanStack hooks (`Schema` / `SchemaRow` / `AlternatingGroup` slices)

- **Date**: 2026-05-21
- **Feature-dev artifacts**: `.feature-dev/1779349637/` (research / review / tasks — `/feature small` pipeline).
- **Prompt**: `implementation/step-08.3/prompt.md` (planner-written 2026-05-21; spec-only, two-voice; D-8.3-1..6 ratified upfront).
- **Output**: `implementation/step-08.3/output.md` (executor self-report — 15/15 acceptance MET).

## Summary

The platform client consumer layer for the three api slices: 3 `createXxxAPI` endpoint factories (12 methods over the Step 8.2 routes) + 12 `useXxx` TanStack mutation hooks on `useWeekMutation`, mirroring Step 7.3 (Block). Strictly `apps/platform/src/lib/{api,hooks}/`, purely additive — no existing identifier renamed, no signature changed; `useWeekMutation` and `keys.ts` byte-identical.

**2 code commits + output report** (`f0adca8a..f86b575b`, base `26f3e697`):

1. `f0adca8a feat(platform): add client api factories for schema schema-row and alternating-group` — 3 endpoint modules + `endpoints/index.ts` + `api/index.ts` (5 files, +93).
2. `10bcd4b6 feat(platform): add schema schema-row and alternating-group mutation hooks` — 3 hook modules + `hooks/index.ts` (4 files, +147).
3. `f86b575b docs(step-08.3): write executor output report`.

**9 code files** (6 created + 3 barrels modified). Verifications all-green (planner spot-checked): `pnpm check-types` 16/16 (planner re-ran `pnpm --filter platform check-types` — `tsc --noEmit` clean, 0 diagnostics) · `pnpm lint` 16/16 (0 warnings) · `pnpm test` 1680/1680 (132 files, no flake — exact baseline match: 8.3 adds no test, the hook layer mirrors the Block no-unit-test precedent) · `pnpm dep:check` 0 violations. Husky clean on both feat commits; zero `--no-verify` / `--no-edit` / `--no-gpg-sign`. Per-layer atomic — `f0adca8a` factories+barrels (+93), `10bcd4b6` hooks+barrel (+147); no squash (single-package, additive, every intermediate tree green). `/feature small` Stage 5 Review-Light **APPROVED** (0 CRITICAL / 0 WARNING / 0 INFO — no hostile-QA stage in the `small` pipeline).

**Planner spot-check** confirmed verbatim:

- `endpoints/{schemas,schema-rows,alternating-groups}.ts` — `createXxxAPI = (client: ApiClient) => ({ … })`, byte-faithful mirror of `createBlocksAPI`; reorder/addMember params typed with api-level `*Request` types, not entity `*Data` (D-8.3-4).
- `alternating-groups.ts` `removeMember` — `client.request(url, "DELETE")` (NOT `requestNoContent`), `Promise<AlternatingGroup | null>` (D-8.3-5); both ids in the path, no request body.
- `use-schemas.ts` `useReorderSchemas` — TVars exactly `ReorderSchemasRequest` (the `z.union`); QA-I1 closed at the type level (`null` unassignable to either scope key).
- all 12 hooks `(planId, startDate)` + TVars (D-8.3-3), `"use client"`, on `useWeekMutation`; `git diff 26f3e697..HEAD` of `use-week-mutation.ts` + `keys.ts` empty (D-8.3-2 / D-8.3-6 — toasts retained).
- 3 barrels — alphabetical insertion; the pre-existing non-alphabetical `coach-*` cluster untouched.
- Scope confined: `git diff 26f3e697..HEAD` only `apps/platform/src/lib/{api,hooks}/` + `implementation/step-08.3/output.md`; `packages/*`, the 8.2 `route.ts` files, Prisma schema, `analysis/`, `apps/admin` — 0 lines.

## Open questions resolved

None — zero executor escalations. One executor judgment recorded in `output.md`: the `reorder` return type (a named `*Response` type vs. an inline `{ schemas: Schema[] }`). The executor chose inline, matching prompt § 3 / § 5 (mirror `createBlocksAPI.reorder`'s `{ blocks }`); the § 0.4 listing of `ReorderSchemasResponse` was a type inventory, not a mandate. Correct call, no escalation needed.

## Deviations

**15/15 acceptance MET.** No structural deviations. Prompt § 6 planned 2 code commits + 1 output — reality is exactly that. lint `--fix` (prettier) collapsed a few multi-line expressions to single-line where they fit the print-width — identical to the `blocks.ts` idiom, no semantic change (a lint-staged auto-format precedent, family of Step 6.4 D-5 / 7.2 D-2 / 7.3 D-1).

## Analysis-artifacts touched

None — 8.3 is a client-layer wrap over the settled routes; no domain-semantics change (per WORKFLOW.md `analysis/` rules — hooks are not the domain layer). `schema.prisma`, `types.ts`, `er-final.md`, the synthesis/formalization shape files — all byte-identical.

## Smoke-test status

**N/A** — no runtime UI; the hooks are reachable only via the future Step 8.4 UI. UI smoke resumes at the Step 8.4 anchor.

## Process note

**Validation verdict: clean — Review-Light APPROVED, all gates green, the two load-bearing traps (D-8.3-4 api-level reorder types, D-8.3-5 `removeMember` via `client.request`) confirmed verbatim, `useWeekMutation` / `keys.ts` byte-identical, scope confined, no drift into 8.3.5.** Step accepted. Zero escalations — a clean `/feature small` thin-wrapper consumer-layer run, the Step 7.3 precedent holding.

**Planner-discipline note — thesis-cycle instinct-spec (flavour (b) `[[coach-pov-first]]`).** The first thesis-cycle walkthrough named the archetype "EMOM 12" — wrong: "EMOM" is the archetype; "12" (minutes) is a schema-level setting, not part of the archetype name. The user (domain expert) corrected it; the prompt § 1 walkthrough shipped fixed ("archetype «EMOM»"). This is a planner instinct-spec — a concrete coach-facing example invented for vividness without grounding it in the `analysis/artifacts/` archetype catalogue. No code impact (the walkthrough is a planning artifact; 8.3 ships no UI), but it is exactly the failure mode flavour (b) guards against: a domain-vocabulary detail asserted from instinct. Lesson, folded into `04-next-action.md` process reminders: walkthrough concrete examples (archetype names, rowKinds, exercise prescriptions) are domain claims — ground them in `analysis/` or keep them generic; do not invent for vividness.

**Next planner action**: Step 8.3.5 — the `schemas[]` read-embed into `blockSchema` (the read surface; cross-package contract + api-server, mirror Step 7.3.5). See `state/04-next-action.md`.
