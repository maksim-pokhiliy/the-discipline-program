# Step 8.1d — executor output report

**Prompt:** `implementation/step-08.1d/prompt.md` — `lmsAlternatingGroupApi` api-server slice (`create` / `addMember` / `removeMember` / `delete` + `verifyAlternatingGroupOwnership` guard + `mapToAlternatingGroup` mapper + `addMember`/`removeMember` contract schemas + a group-aware change to `lmsSchemaApi.delete`).

**Branch:** `feat/training-domain` (no new branch cut; long-lived). **Base SHA:** `b9f1943c`. **Tip SHA:** `5f1e8302` after Commits 1-5; the output-report commit lands on top (this file).

**Wrapper:** `/feature` full pipeline — Research → Design → Plan → Implement → Review → QA → Test → Docs → Finalize.

**analysis-files touched: implementation-notes.md** (§4.10 addendum only; no shape file changed).

## Что сделано

`lmsAlternatingGroupApi` shipped end-to-end at the api-server layer:

- **Contract slice (`@repo/contracts/lms/alternating-group`)** — `createAlternatingGroupSchema.schemaIds` gained `.max(24)` (QA-004 closure); the slice exports an `addMember`/`removeMember` member-ref request schema (one shape, defined once and aliased for both ops), the `addMember` response (`alternatingGroupSchema`), and the `removeMember` response (`alternatingGroupSchema.nullable()` — `null` ⇒ the group dissolved). Inferred types and boundary + member-op contract tests added.
- **Guard (`authz/alternating-group-guards.ts`, new file)** — `verifyAlternatingGroupOwnership(groupId, userId): Promise<{ status, blockId, sessionId, dayId, weekId, planId }>`, mirroring `verifyBlockOwnership` 1:1 (single nested `findUnique` walking `block → session → day → week → plan`, two-stage creator-then-`isAdminOrHeadCoach` check, `NotFoundError` on missing/soft-deleted, `ForbiddenError` otherwise). Added to the `authz/guards` barrel. **REVIEW-I3 closure**: see below.
- **Mapper (`mappers/lms/alternating-group.mapper.ts`, new file)** — `mapToAlternatingGroup`, pure projection (no Json columns ⇒ no Zod `.parse()`), `relationKind` direct pass-through (Prisma enum string-identical to the contract enum, per `mapToSchema`'s `kind` precedent), `schemaIds` materialised from `schemas.map(s => s.id)`. Registered in `mappers/lms/index.ts`.
- **Endpoint (`endpoints/lms/alternating-group/`)** — `lmsAlternatingGroupApi` with `create` / `addMember` / `removeMember` / `delete`. Module-scope `GROUP_WITH_SCHEMAS_INCLUDE` (`{ schemas: { orderBy: { order: "asc" }, select: { id } } }`) keeps `schemaIds` deterministic. Sibling `assertions.ts` holds three `TxClient`-taking helpers — `assertPlanEditableInTx` (in-tx plan re-check dedup'd across the three cardinality-changing ops), `assertGroupMembersApplicable` (the bulk `create` invariant — count match, top-level D-A6, archetype homogeneity D-A6.1, not-already-grouped, same-block; returns the uniform `blockId`), and `assertMemberApplicable` (the single-member `addMember` invariant — same shape, already-in-this-group vs other-group distinction). All three cardinality-changers run under `Serializable` + `retryOnP2034`; `delete` is a single statement (`onDelete: SetNull` on `Schema.alternatingGroup` nulls members, schemas survive ungrouped). `removeMember` dissolves the group when the current member count is `≤ 2` (returns `null` — D-A4; the `≤` defensively dissolves a degenerate already-sub-2 group). Slice barrel + lms endpoints barrel updated.
- **`lmsSchemaApi.delete` group-aware (D-A4 scope expansion)** — wrapped in `retryOnP2034 + $transaction(Serializable)`; in-tx: read the target schema's `alternatingGroupId`, delete the schema, count remaining group members, dissolve the group if `< 2`. The read + delete + count + conditional dissolve all share one Serializable tx — load-bearing race: an out-of-tx read could miss a concurrent `addMember` and orphan a 1-member group. `verifySchemaOwnership` was NOT extended (per prompt § 0.3); `alternatingGroupId` is resolved locally in the tx. Signature unchanged `(userId, schemaId) => Promise<void>`. The QA-W1 in-tx `plan.deletedAt` re-check stays deferred (out of 8.1d scope).
- **Analysis §4.10 addendum** — `implementation-notes.md` records the four structural invariants `lmsAlternatingGroupApi` enforces, that `setEnumeration` tiling is deliberately not API-validated (D-A5), and that the ≥2 invariant holds at both `removeMember` and member-schema delete sites. Cites D-A4 / D-A5 / D-A6 / D-A6.1.

## Изменённые/созданные файлы

**Created (6):**

- `packages/api-server/src/authz/alternating-group-guards.ts` (83 lines)
- `packages/api-server/src/endpoints/lms/alternating-group/admin.ts` (187 lines)
- `packages/api-server/src/endpoints/lms/alternating-group/assertions.ts` (132 lines)
- `packages/api-server/src/endpoints/lms/alternating-group/index.ts` (1 line — slice barrel)
- `packages/api-server/src/endpoints/lms/alternating-group/admin.test.ts` (~1127 lines — 41 endpoint cases after the Stage-7 addition)
- `packages/api-server/src/mappers/lms/alternating-group.mapper.ts` (16 lines)

**Modified (12):**

- `packages/contracts/src/entities/lms/alternating-group/alternating-group.schema.ts` (+1: `.max(24)`)
- `packages/contracts/src/entities/lms/alternating-group/alternating-group-api.schema.ts` (+8: addMember/removeMember schemas)
- `packages/contracts/src/entities/lms/alternating-group/alternating-group-api.types.ts` (+16: inferred types)
- `packages/contracts/src/entities/lms/alternating-group/alternating-group.schema.test.ts` (+21: `.max(24)` boundary)
- `packages/contracts/src/entities/lms/alternating-group/alternating-group-api.schema.test.ts` (+45: member-op cases)
- `packages/api-server/src/authz/guards.ts` (+1: barrel export of `alternating-group-guards`)
- `packages/api-server/src/authz/guards.test.ts` (+118: 6 `verifyAlternatingGroupOwnership` cases)
- `packages/api-server/src/endpoints/lms/index.ts` (+1: barrel export of `alternating-group`)
- `packages/api-server/src/endpoints/lms/schema/admin.ts` (+28-1: only `lmsSchemaApi.delete` body — wrapped in `retryOnP2034 + $transaction(Serializable)`; added `SURVIVING_GROUP_FLOOR = 2`)
- `packages/api-server/src/endpoints/lms/schema/admin.test.ts` (+169: 3 D-A4 dissolution cases + 1 Stage-7 1-member-orphan case)
- `packages/api-server/src/mappers/lms/index.ts` (+1: barrel export of `alternating-group.mapper`)
- `analysis/artifacts/06-formalization/implementation-notes.md` (+8: §4.10 addendum)

**Not touched** (in scope but no edit needed): `@repo/contracts` `package.json` `exports` + `entities/lms/index.ts` (slice already registered by 8.1c); the slice `index.ts` barrel (existing `export *` covers the new exports); no other `analysis/` file (`domain-model.md §7` and `edge-cases.md §6.5` already delegate to `implementation-notes.md`).

**Explicitly out of scope and verified untouched**: `apps/**`, `packages/api-routes`, `packages/api-client`, `packages/query`, Prisma schema, `mappers/lms/schema.mapper.ts` (D-A2 — `Schema.alternatingGroupId` NOT exposed in contract this step), `lmsSchemaApi.{create,update,reorder}`, `authz/lms-guards.ts` (REVIEW-I3 closure — see below), `analysis/artifacts/00-meta/**`.

## Принятые решения

All carry-forward from the 8.1d thesis cycle (planner-user chat 2026-05-20); no new decisions surfaced during execution. Verbatim per prompt § 1.x:

- **D-A4** — dissolve-on-shrink-below-2; `lmsSchemaApi.delete` scope expansion. Implemented at both `lmsAlternatingGroupApi.removeMember` (`≤ 2` pre-update threshold) and `lmsSchemaApi.delete` (`< 2` post-delete threshold). `removeMember`'s response shape is `AlternatingGroup | null` accordingly.
- **D-A5** — `setEnumeration` tiling is NOT API-enforced. The endpoint reads no `setEnumeration` field; structural invariants only.
- **D-A6** — members are top-level block schemas only (`parentSchemaId === null`). Enforced by `assertGroupMembersApplicable` and `assertMemberApplicable`.
- **D-A6.1** — archetype homogeneity (`archetype.name === "alternating-sets"`). Enforced by the same helpers, reading `archetype: { select: { name } }` in the same `findMany`/`findUnique`.
- **QA-004** — `createAlternatingGroupSchema.schemaIds` gained `.max(24)`, chained between `.min(2)` and `.refine` (`.max()` is a `ZodArray` method; `.refine()` returns `ZodEffects` which has no `.max()` — chain order load-bearing). Entity `alternatingGroupSchema.schemaIds` unchanged (output schema is not an input guard).
- **QA-005** — no mirror `.refine` on `alternatingGroupSchema`. `mapToAlternatingGroup` derives `schemaIds` as `schemas.map(s => s.id)` over a Prisma relation; duplicates impossible by construction.

## Возникшие вопросы и как решены

**Stage 6 QA (adversarial pass) — 0 critical, 0 warning, 5 INFO findings.** Three of the INFO findings led to test additions (Stage 7, Commit 5); the other two were noted for awareness (QA-E3 `userId === undefined` propagation — explicitly deferred cross-guard `/fix` per prompt § 7; INFO-1 per-member `verifyPlanEditable` in `create` — harmless redundancy, all owners reach the same plan or `NotFoundError` throws first).

**Stage 6 → Stage 7 fold-back (3 test additions, Commit 5):**

- `addMember` cross-plan schema owned by the same coach — exercises `schemaOwner.planId !== owner.planId` → `NotFoundError`, distinct from the existing "schema does not exist" via guard and from `create`'s cross-plan case. Real gap; added.
- `removeMember` on a degenerate 1-member orphan group — defensive test of the `≤ SURVIVING_MEMBER_FLOOR` threshold.
- `lmsSchemaApi.delete` on the sole member of a 1-member orphan group — mirror of the above for the schema-delete path; the `< SURVIVING_GROUP_FLOOR` branch dissolves the group when post-delete count is 0.

**Spec-clarity micro-decision** — the prompt § 3.2.c per-method bullets for `addMember`/`removeMember` did not explicitly enumerate the in-tx plan re-check; the intro paragraph said "mirror `lmsSchemaRowApi.create`" (which does the in-tx re-check) and plan.md Task 8 spec'd it for all three. Resolved by treating the intro's "mirror `lmsSchemaRowApi.create`" as authoritative — all three writes get the in-tx plan re-check via the extracted `assertPlanEditableInTx` helper. Confirmed by Stage-5 review (TOCTOU-correct, manifesto-correct dedup, no scope creep — `delete`-of-existing-methods QA-W1 stays deferred per prompt § 7).

**No structural escalation needed** (prompt § 10 protocol). The spec is fully ratified and internally consistent; § 0 verbatim quotes all verified current at Research time with zero drift.

## REVIEW-I3 closure — `lms-guards.ts` split outcome

**Axis chosen:** lift the new guard into its own file (DP-1's recommended axis). `verifyAlternatingGroupOwnership` lives in a new `packages/api-server/src/authz/alternating-group-guards.ts` (83 lines). **`packages/api-server/src/authz/lms-guards.ts` was not touched** — stays at the same 293 logical lines that was the pre-step state, eslint `max-lines: 300` passes trivially with zero risk of re-ordering churn in the four shipped guards. The new file joins the `authz/guards.ts` barrel; every importer keeps resolving via `from "…/authz/guards"` (zero deep imports of `lms-guards` exist — split fully invisible).

**DP-2 — separate `refactor` commit:** **no**. The chosen axis creates a _new_ file _with_ the new guard, not a behaviour-preserving move of existing guards. There is no pure pre-refactor to commit standalone. The new guard is part of Commit 2's api-server vertical.

**DP-3 — membership helper placement:** sibling `endpoints/lms/alternating-group/assertions.ts`, matching the `schema/` + `schema-row/` precedent. Three helpers (`assertPlanEditableInTx`, `assertGroupMembersApplicable`, `assertMemberApplicable`); two callers (`create` + `addMember`) share `assertMemberShape`; the in-tx plan re-check de-dup'd across `create`/`addMember`/`removeMember`.

## Что отложено

Carry-forward to subsequent steps (prompt § 7):

- **HTTP routes** (`POST` create / member add+remove / `DELETE` group) — Step 8.2.
- **Client hooks** (TanStack Query wrappers) — Step 8.3.
- **Read surface** — `get` / `list` api method + `mapToSchema` exposing `alternatingGroupId` + the `AlternatingGroup` read-embed — Step 8.3.5 (D-A2). `getAlternatingGroupsResponseSchema` already exists, unconsumed, awaiting that step.
- **UI** — the group bracket + "group as alternating sets" affordance — Step 8.4+.
- **QA-W1** — `lmsSchemaApi.delete` (and `lmsSchemaRowApi.update`/`.delete`) lack an in-tx `plan.deletedAt` re-check — deferred cross-cutting `/fix`. The 8.1d `lmsSchemaApi.delete` change was strictly the group-aware addition; QA-W1 stays deferred.
- **QA-E3** — `userId === undefined` propagates as `PrismaClientValidationError` across all ownership guards including the new `verifyAlternatingGroupOwnership` — deferred uniform cross-guard `/fix`. `verifyAlternatingGroupOwnership` mirrors its four sibling guards exactly, including that known behaviour.

## Ссылка на `.feature-dev/<ts>/`

`.feature-dev/1779278640/` (relative to repo root) — Research (`research.md`), Design (`design.md`), Plan (`plan.md`), Review (`review.md`), QA (`qa.md`), Stage-4 resume artifact (`tasks.md`).

## Verification notes

**Final root sweep (Stage 7):**

| Command            | Result                            | Notes                                                                                         |
| ------------------ | --------------------------------- | --------------------------------------------------------------------------------------------- |
| `pnpm check-types` | PASS — 16/16 packages             |                                                                                               |
| `pnpm lint`        | PASS — 16/16 packages, 0 warnings | confirms the new guard file passes eslint `max-lines`; `lms-guards.ts` byte-identical to base |
| `pnpm test`        | **PASS — 132 files / 1670 tests** | Stage 7 full-suite run, ~8m08s, no flake encountered                                          |
| `pnpm dep:check`   | PASS — 0 violations               | 1267 modules / 2379 deps cruised                                                              |

**Coverage delta:**

- `endpoints/lms/alternating-group/admin.test.ts` — 41 endpoint cases (new file).
- `authz/guards.test.ts` — 6 new `verifyAlternatingGroupOwnership` cases.
- `endpoints/lms/schema/admin.test.ts` `describe("delete")` block — 4 new cases (3 D-A4 dissolution + 1 Stage-7 1-member-orphan).
- `packages/contracts/src/entities/lms/alternating-group/*.test.ts` — boundary (24 OK / 25 reject) + member-op (member-ref accept/reject + `removeMember` accepts `null`) cases added.

**Husky hygiene:** all 5 commits passed `pre-commit` (`check-secrets` → `lint-staged` → `turbo run check-types --filter="...[HEAD]"`) on first attempt; zero `--no-verify` / `--no-edit` / `--no-gpg-sign` invocations.

**UI smoke-test:** N/A. 8.1d ships no HTTP route and no UI (those are Steps 8.2 / 8.4+).

**Commit chain (`git log --oneline b9f1943c..HEAD`)** after Commit 6 lands:

1. `a2e261e8 feat(contracts): add alternating-group member operation schemas`
2. `f99d9ba6 feat(api-server): add lmsalternatinggroupapi with ownership guard and mapper`
3. `125fd3ba feat(api-server): dissolve alternating group when a member schema is deleted`
4. `65b80a5b docs(analysis): record alternatinggroup operational semantics for step 8.1d`
5. `5f1e8302 test(api-server): cover qa-flagged scenarios from step 8.1d adversarial pass`
6. `docs(step-08.1d): write executor output report` (this file)

**Commit-count adjustment vs. prompt § 6:** the planner pre-spelled 4 code/docs commits + 1 output-report commit (= 5 total). Stage 6 adversarial review flagged a real test gap (`addMember` cross-plan) + 2 defensive 1-member-orphan cases that Stage 7 added — committed separately as Commit 5 to preserve per-layer atomicity and respect the harness's no-interactive-rebase rule (amending into Commits 2+3 would have required `git rebase -i` which is unavailable). Net commit count: 6 (5 code/docs + 1 output report).

## Acceptance criteria self-check (prompt § 4, 1-21)

| #   | Criterion                                                                                                                                                              | Status                                                                     | Evidence                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | `createAlternatingGroupSchema.schemaIds` has `.max(24)`, chained before `.refine`; entity schema no `.max()`                                                           | MET                                                                        | `alternating-group.schema.ts:18-25`                                               |
| 2   | `alternating-group-api.schema.ts` exports member-ref + addMember/removeMember response (nullable); types match                                                         | MET                                                                        | `alternating-group-api.schema.ts:12-20`, `alternating-group-api.types.ts:14-26`   |
| 3   | Contract tests cover `.max(24)` boundary; member-ref; `removeMember` accepts `null`                                                                                    | MET                                                                        | `alternating-group.schema.test.ts` 92-108, `alternating-group-api.schema.test.ts` |
| 4   | `verifyAlternatingGroupOwnership` added with the documented return shape + error semantics; covered in `guards.test.ts`                                                | MET                                                                        | `alternating-group-guards.ts:10-83`, `guards.test.ts` (new `describe` block)      |
| 5   | `lms-guards.ts` split so eslint `max-lines` passes; barrel updated; importers still via `authz/guards`                                                                 | MET (split = lift new guard into own file; `lms-guards.ts` byte-identical) | `authz/guards.ts:1`, `pnpm lint` clean                                            |
| 6   | `mapToAlternatingGroup` added + registered; projects `schemas` → `schemaIds`; no `.parse()`; `relationKind` pass-through                                               | MET                                                                        | `alternating-group.mapper.ts`, `mappers/lms/index.ts:1`                           |
| 7   | `lmsAlternatingGroupApi` exports the four methods with the documented signatures; slice barrel + endpoints barrel updated                                              | MET                                                                        | `endpoints/lms/alternating-group/admin.ts`, `endpoints/lms/index.ts:2`            |
| 8   | `create` invariants + `Serializable` + `retryOnP2034`                                                                                                                  | MET                                                                        | `admin.ts:30-75`, `assertions.ts:45-86`                                           |
| 9   | `addMember`/`removeMember` invariants + `removeMember` dissolve-returns-`null` + concurrency wrap                                                                      | MET                                                                        | `admin.ts:77-174`                                                                 |
| 10  | `delete` removes the group; members survive `alternatingGroupId`-nulled                                                                                                | MET                                                                        | `admin.ts:176-186`                                                                |
| 11  | `lmsSchemaApi.delete` group-aware; in-tx read + delete + count + conditional dissolve in one `Serializable` tx + `retryOnP2034`; `create`/`update`/`reorder` untouched | MET                                                                        | `endpoints/lms/schema/admin.ts:226-260`                                           |
| 12  | Endpoint tests + dissolution tests cover § 5 axes                                                                                                                      | MET                                                                        | `admin.test.ts` 41 cases, `schema/admin.test.ts` 4 new                            |
| 13  | `implementation-notes.md` §4.10 addendum; no other `analysis/` file changed; `00-meta/**` untouched                                                                    | MET                                                                        | `implementation-notes.md:1359-1365`                                               |
| 14  | No `get`/`list` method; `getAlternatingGroupsResponseSchema` untouched; contract `Schema`/`mapToSchema` untouched (D-A2)                                               | MET                                                                        | `git diff` confined; `mapToSchema` byte-identical                                 |
| 15  | `pnpm check-types` 16/16                                                                                                                                               | MET                                                                        | Stage 7 final sweep                                                               |
| 16  | `pnpm lint` 16/16, 0 warnings                                                                                                                                          | MET                                                                        | Stage 7 final sweep                                                               |
| 17  | `pnpm test` all packages pass                                                                                                                                          | MET                                                                        | Stage 7 final sweep — 1670/1670                                                   |
| 18  | `pnpm dep:check` 0 violations                                                                                                                                          | MET                                                                        | Stage 7 final sweep                                                               |
| 19  | Husky pre-commit + pre-push clean on every commit; zero skip-flags                                                                                                     | MET                                                                        | every commit's husky log; no `--no-verify` used                                   |
| 20  | Per-layer atomic commits per § 6; no squash                                                                                                                            | MET (with one extension: Commit 5 added the QA-flagged tests separately)   | `git log --oneline b9f1943c..HEAD`                                                |
| 21  | `git diff b9f1943c..HEAD` confined to § 2 file list; `apps/**`, `api-routes`, `api-client`, Prisma show 0 lines                                                        | MET                                                                        | 18 files changed, all inside the § 2 list                                         |

**All 21 acceptance criteria met.** No deferred or partial.

## Handoff

Next planner action (per prompt § 10 handoff): **Step 8.2 — HTTP routes for the `Schema` / `SchemaRow` / `AlternatingGroup` api slices.** The api-server vertical for `AlternatingGroup` is complete after 8.1d.
