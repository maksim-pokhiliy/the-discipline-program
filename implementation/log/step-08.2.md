# Step 08.2 — Platform HTTP routes (`Schema` / `SchemaRow` / `AlternatingGroup` api slices)

- **Date**: 2026-05-20
- **Feature-dev artifacts**: `.feature-dev/1779294967/` (research / design / plan / tasks / review / qa).
- **Prompt**: `implementation/step-08.2/prompt.md` (planner-written 2026-05-20; spec-only, two-voice; D-8.2-1..6 ratified upfront, D-8.2-7 added mid-execution).
- **Output**: `implementation/step-08.2/output.md` (executor self-report — 17/17 acceptance MET).

## Summary

The platform HTTP layer for the three api slices: 10 Next.js App Router `route.ts` handlers over all 12 write methods of `lmsSchemaApi` / `lmsSchemaRowApi` / `lmsAlternatingGroupApi`, plus contract enablers (named route-param schemas + widened reorder-request schemas). Composition byte-mirrors the Block precedent (Step 7.2): `withCoachAuth( withAuthRateLimit( createAuth*Handler(...), RATE_LIMIT_TIER.API ) )`. The server vertical + contracts were already shipped (8.0b / 8.1a / 8.1b / 8.1d); 8.2 is the HTTP wiring.

**7 executor code/test commits + output report** (`499b11cb..0728017f`, interleaved with 2 planner docs commits — `599b01fd` prompt + `e91f6344` mid-execution ratify):

1. `499b11cb feat(contracts): add route params and reorder-scope request schemas` — named params schemas (`{planId}` / `{planId, <id>}`) for the three slices mirroring `blockByIdParamsSchema`; widened reorder-request schemas. Initially shipped `reorderSchemasRequestSchema` as `z.object + superRefine`.
2. `44a3680a refactor(contracts): use a z.union for the widened reorder request schema` — D-8.2-7: `superRefine` → `z.union` (see Open questions).
3. `25f1f257 feat(platform): add http routes for schema crud and reorder` — 3 route.ts; `POST` scope-split (`toCreateArgs`), `reorder` union-narrow (`toReorderScope`) + `.then` wrap.
4. `2b2b5e0c feat(platform): add http routes for schema-row crud and reorder` — 3 route.ts.
5. `5ba0e170 feat(platform): add http routes for alternating-group operations` — 4 route.ts; `removeMember` via `createAuthActionHandler` (D-8.2-5).
6. `a255445a refactor(contracts): reuse the entity reorder schema in the schema-row request schema` — Review CODE-002 fix (dedup `orderedIds`).
7. `716c95f2 test(contracts): cover the widened reorder schema validation invariants` — adversarial + behavioural cases.
8. `0728017f docs(step-08.2): write executor output report`.

**18 code files** (10 route created + 8 contract modified). Verifications all-green (planner spot-checked): `pnpm check-types` 16/16 · `pnpm lint` 16/16 (0 warnings) · `pnpm test` 1680/1680 (no flake) · `pnpm dep:check` 0 violations. Scope-guard: `api-server` / `api-routes` / Prisma / `analysis/` — 0 lines (`git diff main..HEAD`). Husky clean on every commit (`44a3680a` — 1 commitlint warning `footer-leading-blank`, 0 errors, hook passed); zero `--no-verify` / `--no-edit` / `--no-gpg-sign`. Stage 5 Review **APPROVED** (0 CRITICAL, 0 WARNING, 1 INFO CODE-002 fixed). Stage 6 QA **Score A** (0 CRITICAL; QA-W2 / QA-I1 / QA-I2 → forward-notes).

**Planner spot-check** confirmed verbatim:

- `reorderSchemasRequestSchema` (`schema-api.schema.ts:34-43`) — `z.union` of two members, each rejecting the other's scope key via `z.undefined().optional()`; the entity `reorderSchemasSchema` is byte-identical (`extend` does not mutate the base).
- `schemas/reorder/route.ts` — `toReorderScope` narrows via `request.blockId !== undefined`, no `throw`, no `!` (D-8.2-7 / `[[type-quality]]`).
- `schemas/route.ts` — `toCreateArgs` destructure-splits the body into `{ scope, data }`, `scope = parentSchemaId != null ? { parentSchemaId } : { blockId }`.
- `alternating-groups/[groupId]/members/[schemaId]/route.ts` — `createAuthActionHandler` (not the delete factory), nullable response schema.
- Scope confined; no GET route / read method (D-8.2-2); `packages/api-routes` untouched (D-8.2-5).

## Open questions resolved

- **`z.union` vs `superRefine` (mid-execution escalation).** Prompt § 3.1 op 2 delegated the widened reorder-schema's Zod shape to the executor and nudged toward `superRefine` ("mirror `trailingConnectorSchema`"). The executor shipped `superRefine` (`499b11cb`), then while implementing the Schema routes found that `z.infer` of a `superRefine`-over-a-both-keys-optional-object keeps both scope keys `optional` — the reorder handler could not narrow to the api's `CreateScope` union without a dead `throw` on a branch `superRefine` had already made unreachable (compiler-appeasement, rejected per `[[type-quality]]`). Escalated → planner ratified `z.union` of two scope members (narrows cleanly, no throw); applied in `44a3680a`, ratification recorded in `e91f6344`. This is a `[[planner-lint-impact-trace]]` (flavour i) class miss — the planner prescribed a Zod shape without simulating its inferred-type shape. → D-8.2-7; flavour (i) + the memory entry extended at close-out with a Zod-inferred-type-shape sub-axis.

## Deviations

**17/17 acceptance MET.** Commit-count expansion: prompt § 6 planned 4 code + 1 output; reality is 7 code/test + 1 output. The delta is the `z.union` escalation (`499b11cb` `superRefine` + `44a3680a` fix, with planner `e91f6344` stacked between), the CODE-002 review-fix (`a255445a`), and the adversarial tests as their own commit (`716c95f2`). Per-layer atomicity holds by type-check (every intermediate tree is green — the contract additions are additive, routes consume them later); the harness blocks `git rebase -i` so corrections landed as fix-commits, not amends. No squash. Precedent: Step 8.1d's commit-count expansion from QA tests.

## Two minor prompt inaccuracies (planner-owned)

- Prompt header "branch is 1 commit ahead of `main`" — it was 2 (`34385f21` + the `599b01fd` prompt commit). LOW; executor folded in, used `599b01fd` as the diff baseline.
- § 3.1 op 4 "Block has no params-schema test" — false; `block-api.schema.test.ts` does test its params schemas. The planner asserted a precedent fact without a verbatim read. D-8.2-3's decision (trivial `z.object({cuid})` params schemas need no dedicated test) survived on its own merit — the executor re-grounded it (such a test re-asserts only what Zod already guarantees). LOW. Lesson: instinct-spec vs. verbatim-read applies even to "obvious" precedent claims.

## Analysis-artifacts touched

None — 8.2 is HTTP wiring over the settled domain model; no domain-semantics change (per WORKFLOW.md `analysis/` rules — routes are not the domain layer). `schema.prisma`, `types.ts`, `er-final.md`, synthesis/formalization shape files — all byte-identical.

## Smoke-test status

**N/A** — no runtime UI; the routes are reachable only via the future Step 8.3 hooks. UI smoke resumes at the Step 8.4 anchor.

## Process note

**Validation verdict: clean — Review APPROVED / QA Score A, all gates green, the `z.union` narrowing confirmed verbatim, scope confined, no drift into 8.3 / 8.3.5.** Step accepted.

One escalation cycle (`z.union`), handled per protocol — executor surfaced with a hypothesis, planner ratified fast and recorded it. Two LOW planner-owned prompt inaccuracies, neither blocking. The `z.union` miss expands flavour (i) `[[planner-lint-impact-trace]]` with a Zod-inferred-type-shape sub-axis: a schema's runtime validation and its `z.infer` shape are distinct surfaces — `superRefine`/`refine` over an object preserve the base (both-keys-optional) type, so a runtime exactly-one invariant stays invisible to the type system; `z.union` / `z.discriminatedUnion` yield a narrowable type. When a prescribed schema feeds a typed consumer (here the route handler's `CreateScope`), the planner simulates the inferred type, not just the runtime check.

**Next planner action**: Step 8.3 — platform client API + TanStack hooks for the three slices (mirror Step 7.3). See `state/04-next-action.md`.
