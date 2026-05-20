# Step 8.2 — executor output report

**Prompt:** `implementation/step-08.2/prompt.md` — platform HTTP routes (`route.ts` handlers) for every write method of the `lmsSchemaApi` / `lmsSchemaRowApi` / `lmsAlternatingGroupApi` api slices, plus the `@repo/contracts` route-param + reorder-scope request schemas those routes need.

**Branch:** `feat/training-domain` (no new branch cut; long-lived — ratified override). **Base SHA:** `599b01fd`. **Tip SHA before this report:** `716c95f2`; the output-report commit lands on top (this file).

**Wrapper:** `/feature` full pipeline — Research → Design → Plan → Implement → Review → QA → Test → Docs → Finalize.

## Что сделано

The platform HTTP layer for the three api slices is shipped — 10 Next.js App Router `route.ts` handlers covering all 12 write methods, plus the contract enablers they import.

- **Contracts (`@repo/contracts/lms/{schema,schema-row,alternating-group}`)** — Phase 1, additive within already-registered slice files. Each slice gained named route-param schemas keyed to the Next.js path segments (`planId` always present), mirroring the Block precedent (`blockByIdParamsSchema` / `blockBySessionParamsSchema`): Schema → `schemaByPlanParamsSchema` / `schemaByIdParamsSchema`; SchemaRow → `schemaRowByPlanParamsSchema` / `schemaRowByIdParamsSchema`; AlternatingGroup → `alternatingGroupByPlanParamsSchema` / `alternatingGroupByIdParamsSchema` / `alternatingGroupMemberParamsSchema`. The reorder **request** schemas were widened to carry the routing scope the api methods need: `reorderSchemasRequestSchema` became a `z.union` of two scope members (`blockId` xor `parentSchemaId`, see "Возникшие вопросы"); `reorderSchemaRowsRequestSchema` became `reorderSchemaRowsSchema.extend({ schemaId })`. The entity-level `reorderSchemasSchema` / `reorderSchemaRowsSchema` are unchanged. Inferred types added to each `*-api.types.ts`; the contract tests' obsolete `.toBe(...)` identity assertions were replaced with behavioural cases for the widened schemas.
- **Schema routes (`apps/platform/.../[planId]/schemas/`)** — `route.ts` (`POST` create), `[schemaId]/route.ts` (`PUT` update + `DELETE` delete), `reorder/route.ts` (`PUT` reorder). The `POST` handler performs the load-bearing scope-split: the parsed body is the full `CreateSchemaData` with `blockId` + `parentSchemaId` packed in, but `lmsSchemaApi.create` wants `scope: CreateScope` + `data: SchemaBodyData` as separate args — the call-function (a local `toCreateArgs` helper) computes `scope` (non-null `parentSchemaId` ⇒ `{ parentSchemaId }`, else `{ blockId }`) and `data` (body minus the two scope keys). The `reorder` handler narrows the `z.union` scope (`toReorderScope`) and `.then((schemas) => ({ schemas }))`-wraps the bare `Schema[]` into the `{ schemas }` response shape.
- **SchemaRow routes (`apps/platform/.../[planId]/schema-rows/`)** — `route.ts` (`POST` create, pass-through — `schemaId` rides inside the body), `[schemaRowId]/route.ts` (`PUT` + `DELETE`), `reorder/route.ts` (`PUT` reorder — extracts `schemaId` from the request body as `lmsSchemaRowApi.reorder`'s separate positional arg, `.then((schemaRows) => ({ schemaRows }))`-wraps the result).
- **AlternatingGroup routes (`apps/platform/.../[planId]/alternating-groups/`)** — `route.ts` (`POST` create), `[groupId]/route.ts` (`DELETE` delete, void/204), `[groupId]/members/route.ts` (`POST` addMember — `schemaId` from body), `[groupId]/members/[schemaId]/route.ts` (`DELETE` removeMember). `removeMember` uses `createAuthActionHandler` — not `createAuthDeleteHandler` — because it returns a body (`AlternatingGroup | null`, `null` = the group dissolved); the `.nullable()` response schema serialises a dissolved-group `null` to `200` body `null`.
- **Composition** — every handler is the invariant `withCoachAuth( withAuthRateLimit( createAuth*Handler(...), RATE_LIMIT_TIER.API ) )`, byte-for-byte mirroring the Block route precedent from Step 7.2.

No UI, no client hooks, no GET route, no read api method — those are Steps 8.3 / 8.3.5 / 8.4+ (D-8.2-2; § "Что отложено").

## Изменённые/созданные файлы

**Created (10 route handlers, `apps/platform/src/app/api/platform/training-plans/[planId]/`):**

- `schemas/route.ts` (33 lines) — `POST` create.
- `schemas/[schemaId]/route.ts` (36 lines) — `PUT` update + `DELETE` delete.
- `schemas/reorder/route.ts` (30 lines) — `PUT` reorder.
- `schema-rows/route.ts` (21 lines) — `POST` create.
- `schema-rows/[schemaRowId]/route.ts` (36 lines) — `PUT` update + `DELETE` delete.
- `schema-rows/reorder/route.ts` (24 lines) — `PUT` reorder.
- `alternating-groups/route.ts` (21 lines) — `POST` create.
- `alternating-groups/[groupId]/route.ts` (15 lines) — `DELETE` delete.
- `alternating-groups/[groupId]/members/route.ts` (22 lines) — `POST` addMember.
- `alternating-groups/[groupId]/members/[schemaId]/route.ts` (20 lines) — `DELETE` removeMember.

**Modified (8 contract files, `packages/contracts/src/entities/lms/`):**

- `schema/schema-api.schema.ts` — `schemaByPlanParamsSchema`, `schemaByIdParamsSchema`; `reorderSchemasRequestSchema` redefined as a `z.union`.
- `schema/schema-api.types.ts` — `SchemaByPlanParams`, `SchemaByIdParams`.
- `schema/schema-api.schema.test.ts` — identity assertion replaced; widened-reorder behavioural cases + the MT-5/6/7 adversarial cases.
- `schema-row/schema-row-api.schema.ts` — `schemaRowByPlanParamsSchema`, `schemaRowByIdParamsSchema`; `reorderSchemaRowsRequestSchema` redefined as `reorderSchemaRowsSchema.extend({ schemaId })`.
- `schema-row/schema-row-api.types.ts` — `SchemaRowByPlanParams`, `SchemaRowByIdParams`.
- `schema-row/schema-row-api.schema.test.ts` — identity assertion replaced; widened-reorder behavioural cases + the MT-11 adversarial cases.
- `alternating-group/alternating-group-api.schema.ts` — `alternatingGroupByPlanParamsSchema`, `alternatingGroupByIdParamsSchema`, `alternatingGroupMemberParamsSchema`.
- `alternating-group/alternating-group-api.types.ts` — `AlternatingGroupByPlanParams`, `AlternatingGroupByIdParams`, `AlternatingGroupMemberParams`.

**Not touched** (in scope but no edit needed): the slice `index.ts` barrels (`export *` auto-propagates the new exports), `@repo/contracts` `package.json` `exports`, `turbo.json` — zero registration edits, as predicted (prompt § 0.7). The existing `get…ByIdParamsSchema` / `update…ParamsSchema` / `delete…ParamsSchema` aliases (`= idParamSchema`) were left in place — the new named params schemas are added alongside, not re-pointed (minimal-touch). `alternating-group-api.schema.test.ts` — untouched (its Phase 1 work is trivial `z.object({cuid})` params schemas only, which per D-8.2-3 need no dedicated test).

**Explicitly out of scope and verified untouched** (`git diff` shows 0 lines): `packages/api-routes` (the generic factories — D-8.2-5: the existing `createAuthActionHandler` was used, no new factory), `packages/api-server`, the entity-level `*.schema.ts` (`schema.schema.ts`, `schema-row.schema.ts`, `alternating-group.schema.ts`), Prisma schema, `analysis/**`, `apps/admin`, `getSchemasResponseSchema` / `getSchemaRowsResponseSchema` / `getAlternatingGroupsResponseSchema` and any GET route / read api method.

## Принятые решения

Carry-forward from the 8.2 thesis cycle (planner-user chat 2026-05-20; D-8.2-1..6 ratified, all hypotheses approved), plus D-8.2-7 added during Design and re-ratified mid-execution:

- **D-8.2-1** — collapsed single step, `/feature` full. One step, not split into 8.2a/b/c. Held.
- **D-8.2-2** — no GET routes; the read surface is Step 8.3.5. Held — only the 12 write methods got routes; `get…ResponseSchema` schemas stay unconsumed.
- **D-8.2-3** — 8.2 modifies `packages/contracts` (route-param + reorder-scope schemas). Held. The corrected rationale for "trivial params schemas need no dedicated test": a `z.object({cuid})` re-asserts only what Zod already guarantees — a test adds no signal. (The prompt originally cited "Block has no such test"; Research found Block's `block-api.schema.test.ts` _does_ test its params schemas — the decision stands on its own merit regardless.)
- **D-8.2-4** — the discriminated scope travels in the request body; routes are flat plan-scoped (`POST/PUT .../training-plans/[planId]/schemas[/reorder]`). Held.
- **D-8.2-5** — `removeMember` uses the existing `createAuthActionHandler` (params-only input + a validated response body, verb-agnostic), not `createAuthDeleteHandler` (`204`/void). No new factory added to `@repo/api-routes`. Held.
- **D-8.2-6** — QA-E3 (`userId === undefined` propagation) is closed at the route layer by construction: `withCoachAuth` throws `UnauthorizedError` (`401`) before the handler runs when the session id is absent. Held — no route-side `userId` guard.
- **D-8.2-7** — the widened reorder request schema's exact Zod shape. **Re-ratified mid-execution as `z.union`** (see "Возникшие вопросы").

## Возникшие вопросы и как решены

**Mid-execution escalation — `reorderSchemasRequestSchema` Zod shape (resolved with the user).** Phase 1 first shipped `reorderSchemasRequestSchema` as `z.object + superRefine` (D-8.2-7's original recommendation — mirror the in-repo `trailingConnectorSchema` idiom). It validates correctly, but the Group B (Schema routes) implementation surfaced that its `z.infer` keeps **both** scope keys `optional` — the `superRefine` exactly-one invariant is a runtime check the type system cannot see. The `schemas/reorder` handler therefore could not narrow the parsed body to the api's `CreateScope` union without a dead `throw` on a branch `superRefine` had already made unreachable (compiler-appeasement, rejected per `[[type-quality]]`). This is a `[[planner-lint-impact-trace]]` class miss — Design § 5.6 asserted the split was "structurally assignable to `CreateScope` with no `as`/`!`", true for the create route (`blockId` is required there) but false for reorder. Surfaced to the user, who ratified **`z.union`** of two scope members — member A `{ blockId: cuid, parentSchemaId: undefined?, orderedIds }`, member B the mirror — each member actively rejecting the other's key via `z.undefined()` (the load-bearing gotcha: a bare omission would let a both-keys payload silently pass member A, since `z.object` strips unknown keys; `z.undefined()` makes the forbidden key reject any real value). The `z.union` infers a genuine discriminated type; the handler narrows cleanly via `request.blockId !== undefined`, no throw, no guard chain. Applied in commit `44a3680a`; the user recorded the ratification in `e91f6344` (prompt.md § 3.1 op 2 + acceptance #2 + `04-next-action.md`). `reorderSchemaRowsRequestSchema` was unaffected — it carries a single non-discriminated `schemaId`, so its inferred type was always usable.

**Review finding CODE-002 (INFO, fixed in `a255445a`).** After the `z.union` rework, `schema-api.schema.ts` built its reorder request schema from `reorderSchemasSchema.extend(...)` (reusing the entity schema's `orderedIds`), while `schema-row-api.schema.ts` still inlined a verbatim copy of the `orderedIds` block — a two-instance duplication and a cross-slice asymmetry, both in the touch zone. Fixed: `reorderSchemaRowsRequestSchema = reorderSchemaRowsSchema.extend({ schemaId })`. One `orderedIds` definition per slice, symmetric with the Schema slice.

**Research drifts (LOW-impact, folded in).** (1) The prompt's "branch is 1 commit ahead of `main`" was stale — it is 2 (`34385f21` + the `599b01fd` prompt commit); the diff-confinement baseline used is `599b01fd`. (2) The § 3.1 op 4 "Block has no params-schema test" claim is false — see D-8.2-3 above. Neither blocked execution.

**No structural escalation beyond the above** (prompt § 10 protocol). Every other § 0 verbatim quote verified current at Research time; the factories composed as § 0.4 described; the Block precedent matched § 3.

## Что отложено

Carry-forward (prompt § 7 + the QA pass):

- **Client API + TanStack hooks** — Step 8.3 (mirror Step 7.3). 8.2's routes are their call target.
- **Read surface** — a GET route / read api method, or a `schemas[]` + group embed into the Block/Week read — Step 8.3.5. The `get…ResponseSchema` contract schemas exist, unconsumed, awaiting it.
- **UI** — ArchetypePicker, the Schema editor, the alternating-group bracket — Step 8.4+.
- **QA-W2** (WARNING, new carry-forward) — the `orderedIds` arrays on the reorder schemas have no `.max()` — a latent unbounded-transaction surface. This lives on the **entity-level** `reorderSchemasSchema` / `reorderSchemaRowsSchema`, explicitly out of 8.2's § 2 scope, and the Block reorder schema has the identical gap. Recommendation: a codebase-wide `.max()` ticket on the reorder schemas, not an 8.2 patch.
- **QA-I1** (INFO) — `reorderSchemasRequestSchema` rejects an explicit `parentSchemaId: null`, whereas `createSchemaSchema` accepts it (nullable). A cross-route asymmetry — a note for the Step 8.3 client, harmless at the route layer.
- **QA-I2** (INFO) — the api ownership guards return `403` for another coach's id and `404` for a nonexistent id (an existence oracle). Api-layer-owned, codebase-wide, not introduced by 8.2.
- **QA-W1 / QA-E3** — api-server-layer deferred carry-forwards (`03-deferred.md`); D-8.2-6 records that QA-E3 does not surface at the route layer.
- **PR #199 review note #1 (`schemaIds` ordering)** — covered, no 8.2 artifact: `mapToAlternatingGroup` orders by `Schema.order asc` (pinned by the 8.1d mapper-determinism test); the routes pass that output through unchanged.

No `analysis-files touched` — 8.2 is HTTP wiring over a settled domain model; no `analysis/` file changed (prompt § 9).

## Ссылка на `.feature-dev/<ts>/`

`.feature-dev/1779294967/` (relative to repo root) — Research (`research.md`), Design (`design.md`), Plan (`plan.md`), Review (`review.md`), QA (`qa.md`), Stage-4 resume artifact (`tasks.md`).

## Verification notes

**Final root sweep (Stage 9):**

| Command            | Result                            | Notes                                                                  |
| ------------------ | --------------------------------- | ---------------------------------------------------------------------- |
| `pnpm check-types` | PASS — 16/16 packages             |                                                                        |
| `pnpm lint`        | PASS — 16/16 packages, 0 warnings |                                                                        |
| `pnpm test`        | PASS — 132 files / 1680 tests     | Stage 7 + Stage 9 full-suite runs; no flake (QA-023 did not reproduce) |
| `pnpm dep:check`   | PASS — 0 violations               | 1277 modules / 2409 deps cruised                                       |

**Coverage delta:** `schema-api.schema.test.ts` — the obsolete `reorderSchemasRequestSchema` identity assertion replaced with 4 behavioural cases (block-scope / parent-scope accepted, both-keys / neither-key rejected) + 3 adversarial cases (MT-5 explicit `parentSchemaId: null` rejected, MT-6 empty `orderedIds` rejected, MT-7 duplicate `orderedIds` rejected). `schema-row-api.schema.test.ts` — identity assertion replaced with 3 behavioural cases (`{schemaId, orderedIds}` accepted, missing/non-cuid `schemaId` rejected) + 2 adversarial cases (MT-11 empty / duplicate `orderedIds` rejected). No route-level unit tests added — prompt § 5 ratifies that the Block routes carry none and 8.2 mirrors that; route correctness rides on the tested `@repo/api-routes` factories and the tested `@repo/api-server` api methods (8.1a/b/d).

**Husky hygiene:** every commit passed `pre-commit` (`check-secrets` → `lint-staged` → `turbo run check-types --filter="...[HEAD]"`) on first attempt. Commit `44a3680a` drew one commitlint **warning** (`footer-leading-blank`) — 0 errors, the `commit-msg` hook passed and the commit landed; not a hook failure. Zero `--no-verify` / `--no-edit` / `--no-gpg-sign` invocations.

**UI smoke-test:** N/A. 8.2 ships no runtime UI; the routes are reachable only via the future Step 8.3 hooks (prompt § 9).

**Commit chain (`git log --oneline 599b01fd..HEAD`)** after the output-report commit lands:

1. `499b11cb feat(contracts): add route params and reorder-scope request schemas`
2. `e91f6344 docs(step-08.2): ratify z.union for reorder request schema` _(planner commit — mid-execution ratification, not executor-authored)_
3. `44a3680a refactor(contracts): use a z.union for the widened reorder request schema`
4. `25f1f257 feat(platform): add http routes for schema crud and reorder`
5. `2b2b5e0c feat(platform): add http routes for schema-row crud and reorder`
6. `5ba0e170 feat(platform): add http routes for alternating-group operations`
7. `a255445a refactor(contracts): reuse the entity reorder schema in the schema-row request schema`
8. `716c95f2 test(contracts): cover the widened reorder schema validation invariants`
9. `docs(step-08.2): write executor output report` (this file)

**Commit-count adjustment vs. prompt § 6.** The plan pre-spelled 4 code commits + 1 output-report commit. Reality: 8 commits before this report. The delta is the mid-execution `z.union` escalation — Commit 1 shipped the `superRefine` form, the planner committed the ratification (`e91f6344`), and the corrected form landed as `44a3680a`; plus the CODE-002 review-fix (`a255445a`) and the adversarial test additions (`716c95f2`) each landed as their own commit. They were committed separately rather than amended into earlier commits because the harness disallows interactive rebase and the planner had already stacked `e91f6344` on top of Commit 1. Every intermediate tree type-checks — per-layer atomicity holds, no squash. The 4-phase route/contract structure (§ 6) is intact within the chain.

## Acceptance criteria self-check (prompt § 4, 1-17 — #2 per the `e91f6344` update)

| #   | Criterion                                                                                                                                                                                                                                              | Status                                                         | Evidence                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Each `*-api.schema.ts` exports named route-param schemas (cuid objects, `planId` always) + inferred types                                                                                                                                              | MET                                                            | `schema-api.schema.ts`, `schema-row-api.schema.ts`, `alternating-group-api.schema.ts` + `*-api.types.ts`                                      |
| 2   | `reorderSchemasRequestSchema` is a `z.union` of two scope members each rejecting the other's key, narrows to `CreateScope` without a runtime throw; `reorderSchemaRowsRequestSchema` carries `schemaId` + `orderedIds`; entity-level schemas unchanged | MET                                                            | `schema-api.schema.ts` (`z.union`), `schema-row-api.schema.ts` (`.extend`); `schema.schema.ts` / `schema-row.schema.ts` 0 lines in `git diff` |
| 3   | Contract tests cover the widened reorder request schemas (well-formed accepted; missing/ambiguous rejected)                                                                                                                                            | MET                                                            | `schema-api.schema.test.ts`, `schema-row-api.schema.test.ts`                                                                                  |
| 4   | Schema routes (`POST` / `PUT`+`DELETE` / `PUT` reorder), all the invariant composition                                                                                                                                                                 | MET                                                            | `schemas/route.ts`, `schemas/[schemaId]/route.ts`, `schemas/reorder/route.ts`                                                                 |
| 5   | `POST schemas` splits body into `CreateScope` + `SchemaBodyData`; `reorder` splits scope and wraps into `{schemas}`                                                                                                                                    | MET                                                            | `schemas/route.ts` (`toCreateArgs`), `schemas/reorder/route.ts` (`toReorderScope` + `.then` wrap)                                             |
| 6   | SchemaRow routes; `reorder` extracts `schemaId` and wraps into `{schemaRows}`                                                                                                                                                                          | MET                                                            | `schema-rows/route.ts`, `schema-rows/[schemaRowId]/route.ts`, `schema-rows/reorder/route.ts`                                                  |
| 7   | AlternatingGroup routes (`POST` / `DELETE` / `POST` addMember / `DELETE` removeMember)                                                                                                                                                                 | MET                                                            | `alternating-groups/route.ts`, `[groupId]/route.ts`, `[groupId]/members/route.ts`, `[groupId]/members/[schemaId]/route.ts`                    |
| 8   | `removeMember` uses `createAuthActionHandler` with the nullable response; dissolved-group `null` → `200` body `null`                                                                                                                                   | MET                                                            | `alternating-groups/[groupId]/members/[schemaId]/route.ts`                                                                                    |
| 9   | No GET route, no read api method; `get…ResponseSchema` schemas remain unconsumed                                                                                                                                                                       | MET                                                            | `git diff` — no GET export, no read method                                                                                                    |
| 10  | `packages/api-routes` unmodified; no barrel / `package.json` / `turbo.json` edits; entity-level `*.schema.ts` unmodified                                                                                                                               | MET                                                            | `git diff 599b01fd..HEAD --stat` — 0 lines in those paths                                                                                     |
| 11  | `pnpm check-types` (root) — 16/16                                                                                                                                                                                                                      | MET                                                            | Stage 9 sweep                                                                                                                                 |
| 12  | `pnpm lint` (root) — 16/16, 0 warnings                                                                                                                                                                                                                 | MET                                                            | Stage 9 sweep                                                                                                                                 |
| 13  | `pnpm test` (root) — all packages pass                                                                                                                                                                                                                 | MET                                                            | Stage 7 + Stage 9 — 1680/1680                                                                                                                 |
| 14  | `pnpm dep:check` — 0 violations                                                                                                                                                                                                                        | MET                                                            | Stage 9 sweep — 2409 deps cruised                                                                                                             |
| 15  | Husky pre-commit + pre-push clean on every commit; zero skip-flags                                                                                                                                                                                     | MET                                                            | every commit's husky log; `44a3680a` had a commitlint _warning_ (0 errors); no `--no-verify` used                                             |
| 16  | Per-layer atomic commits per § 6; no squash                                                                                                                                                                                                            | MET (with the documented mid-execution commit-count expansion) | `git log --oneline 599b01fd..HEAD`                                                                                                            |
| 17  | `git diff 599b01fd..HEAD` confined to the § 2 list; `api-server` / `api-routes` / Prisma / `analysis/` / `apps/admin` show 0 lines                                                                                                                     | MET                                                            | 18 code files, all inside the § 2 list; the planner's `e91f6344` additionally touched 2 `implementation/` planning docs                       |

**All 17 acceptance criteria met.** No deferred or partial.

## Handoff

Next planner action (prompt § 10 handoff): **Step 8.3 — platform client API + TanStack hooks for the three slices** (mirror Step 7.3 — `createXxxAPI` factory in `apps/platform/src/lib/api/endpoints/` + `useXxx` mutation hooks). Then 8.3.5 (read-embed) → 8.3.6 → 8.3.7 → 8.4 anchor. At close-out, the planner flagged (in `e91f6344` / `04-next-action.md`) considering an extension to `[[planner-lint-impact-trace]]` with a Zod inferred-type-shape axis, prompted by the `superRefine` → `z.union` escalation.
