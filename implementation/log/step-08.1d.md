# Step 08.1d — `lmsAlternatingGroupApi` (api-server slice: create / addMember / removeMember / delete + guard + mapper)

- **Date**: 2026-05-20
- **Feature-dev artifacts**: `.feature-dev/1779278640/` (research / design / plan / tasks / review / qa).
- **Prompt**: `implementation/step-08.1d/prompt.md` (planner-written 2026-05-20; spec-only, two-voice; D-A4 / D-A5 / D-A6 / D-A6.1 + QA-004 / QA-005 closures ratified upfront in the thesis cycle).
- **Output**: `implementation/step-08.1d/output.md` (executor self-report — 21/21 acceptance MET; two recorded scope flexes vs. § 6 and § 4.5, both planner-accepted at close-out).

## Summary

The api-server vertical for `AlternatingGroup` lands on top of the Step 8.1c definition layer: `lmsAlternatingGroupApi` 4-method endpoint (`create` bulk 2..N / `addMember` / `removeMember` / `delete`), `verifyAlternatingGroupOwnership` guard, `mapToAlternatingGroup` mapper, `addMember` / `removeMember` contract schemas (member-ref request + responses; `removeMember` response nullable for dissolve), `createAlternatingGroupSchema.schemaIds.max(24)` (QA-004 closure). The D-A4 scope expansion shipped: `lmsSchemaApi.delete` becomes group-aware — read+delete+count+conditional dissolve all inside one Serializable transaction wrapped in `retryOnP2034`, so a concurrent `addMember` cannot slip between an out-of-tx read and the delete to orphan a 1-member group (the load-bearing in-tx-read requirement is precisely the race I flagged at prompt-write time).

**6 commits on `feat/training-domain`** (`a2e261e8..66626a11`, base `b9f1943c`):

1. `a2e261e8 feat(contracts): add alternating-group member operation schemas` — `.max(24)` on `createAlternatingGroupSchema.schemaIds` (chained before `.refine`, lint-impact correct); member-ref request + `addMember` / `removeMember` response schemas (response nullable); inferred types; boundary + member-op tests.
2. `f99d9ba6 feat(api-server): add lmsalternatinggroupapi with ownership guard and mapper` — `verifyAlternatingGroupOwnership` in a new `authz/alternating-group-guards.ts` (REVIEW-I3 closure via own-file axis — `lms-guards.ts` byte-identical); `mapToAlternatingGroup` in a new `mappers/lms/alternating-group.mapper.ts`; `lmsAlternatingGroupApi` (new endpoint dir + sibling `assertions.ts` with three `TxClient` helpers — `assertPlanEditableInTx` dedup'd across `create` / `addMember` / `removeMember`; `assertGroupMembersApplicable` for bulk-create; `assertMemberApplicable` for `addMember`); barrels in `mappers/lms/index.ts` + `endpoints/lms/index.ts` + `authz/guards.ts`; endpoint tests + guard tests.
3. `125fd3ba feat(api-server): dissolve alternating group when a member schema is deleted` — `lmsSchemaApi.delete` group-aware (only this function; `create` / `update` / `reorder` byte-identical), `retryOnP2034` + `$transaction(Serializable)`, in-tx read of `alternatingGroupId` → delete → count → conditional `tx.alternatingGroup.delete({ where: id })` when `count < SURVIVING_GROUP_FLOOR = 2`.
4. `65b80a5b docs(analysis): record alternatinggroup operational semantics for step 8.1d` — `analysis/artifacts/06-formalization/implementation-notes.md` §4.10 addendum: four structural invariants + dual-call-site dissolution + the tiling-not-enforced rationale; cites D-A4 / D-A5 / D-A6 / D-A6.1.
5. `5f1e8302 test(api-server): cover qa-flagged scenarios from step 8.1d adversarial pass` — 3 tests added after Stage 6 QA: `addMember` cross-plan same-coach, `removeMember` on 1-member orphan, `lmsSchemaApi.delete` on 1-member orphan. Committed separately because the harness blocks `git rebase -i`; per-layer atomicity preserved.
6. `66626a11 docs(step-08.1d): write executor output report`.

**18 files** (6 created + 12 modified). Verifications all-green (planner spot-checked at close-out): `pnpm check-types` 16/16 · `pnpm lint` 16/16 (0 warnings) · `pnpm test` 1670/1670 (no flake, ~8m08s) · `pnpm dep:check` 0 violations · `git grep` residue-clean in source tree. Husky pre-commit clean on every commit; zero `--no-verify` / `--no-edit` / `--no-gpg-sign`. Stage 5 Review **APPROVE** (0 CRITICAL, 0 WARNING, 2 INFO cosmetic). Stage 6 QA **PASS** (0 CRITICAL, 0 WARNING, 5 INFO; 38 attacks attempted, 0 exploited).

**Planner spot-check** confirmed verbatim:

- `lmsSchemaApi.delete` (`endpoints/lms/schema/admin.ts:226-260`) — the load-bearing requirement is met: the `alternatingGroupId` read at line 235 is **inside** the `async (tx) =>` Serializable callback, not pre-tx. The race I flagged at prompt-write (concurrent `addMember` between an out-of-tx read and the delete) cannot occur.
- `lmsAlternatingGroupApi.removeMember` (`admin.ts:119-174`) — dissolves on `memberCount <= SURVIVING_MEMBER_FLOOR` (i.e. `≤ 2`); the `≤` rather than `=` defensively dissolves a degenerate already-sub-2 group (the case the prompt explicitly called out and that Stage 6 QA added a test for).
- `verifyAlternatingGroupOwnership` (`alternating-group-guards.ts:10-83`) — mirrors `verifyBlockOwnership` 1:1 (resolved `block → session → day → week → plan` chain, two-stage creator-then-`isAdminOrHeadCoach` check, `NotFoundError` on missing/soft-deleted, `ForbiddenError` otherwise); placed in a new file, `lms-guards.ts` `wc -l` = 331 (byte-identical to the pre-step state).
- `mapToAlternatingGroup` (`mappers/lms/alternating-group.mapper.ts`) — pure projection, no `.parse()`, `relationKind` direct pass-through, `schemaIds: schemas.map(s => s.id)` over the `GROUP_WITH_SCHEMAS_INCLUDE` ordered relation (`orderBy: { order: "asc" }`) — deterministic output.
- `implementation-notes.md` §4.10 — 8-line addendum, mirrors §4.8 / §4.9 style, comprehensive, cites all four ratified decisions.
- Prisma schema byte-identical to pre-8.1d (`git diff b9f1943c..HEAD -- packages/api-server/prisma/schema.prisma` empty); `mapToSchema` byte-identical (D-A2 preserved); no scope drift into 8.2 / 8.3.5 / D-A2 territory.

## Open questions resolved

- **§ 3.2.c per-method in-tx plan re-check.** The prompt's per-method bullets for `addMember` / `removeMember` did not explicitly enumerate the in-tx plan re-check; the intro paragraph ("mirror `lmsSchemaRowApi.create`") and plan-stage Task 8 implied it for all three. Executor extracted `assertPlanEditableInTx(tx, planId)` into the sibling `assertions.ts` and dedup'd across `create` / `addMember` / `removeMember`. Stage 5 Review confirmed TOCTOU-correct + manifesto-correct dedup + no scope creep (the existing-method QA-W1 stays deferred). Resolved without escalation.

- **REVIEW-I3 split axis.** The 04-next-action and prompt § 0.6 anticipated splitting `lms-guards.ts` itself; the executor chose the cleaner alternative — lift the new guard into its own `authz/alternating-group-guards.ts` (83 lines), leaving `lms-guards.ts` byte-identical at 331 physical lines / ~293 logical (under the 300 cap). Zero churn risk in the four shipped sibling guards. Accepted as a valid axis: the eslint constraint is cleared; the new file joins the `authz/guards.ts` barrel; all importers continue resolving via `from "…/authz/guards"`. Acceptance #5 phrasing satisfied semantically; planner concurs (the rule was "clear the cap" — the cap is cleared).

## QA-flagged Stage 7 test additions (Commit 5)

Stage 6 surfaced one real test gap + two defensive cases; Stage 7 added them, committed separately because the harness blocks interactive `git rebase -i`:

- `addMember` cross-plan schema owned by the same coach — exercises `schemaOwner.planId !== owner.planId` → `NotFoundError`, distinct from the existing "schema does not exist" via guard and from `create`'s cross-plan case.
- `removeMember` on a degenerate 1-member orphan group — exercises the `≤ SURVIVING_MEMBER_FLOOR` threshold (the `≤` not `=` belt-and-braces).
- `lmsSchemaApi.delete` on the sole member of a 1-member orphan group — mirror for the schema-delete path; post-delete count = 0, `< SURVIVING_GROUP_FLOOR` branch dissolves cleanly.

Net commit count: 5 code/docs + 1 output report = 6 (vs. prompt § 6's planned 4 code/docs + 1 output = 5). Per-layer atomicity preserved.

## Deviations (acceptance #5 + #20 — both planner-accepted at close-out)

**21/21 acceptance MET.** Two recorded scope flexes:

- **#5 (REVIEW-I3 split axis).** Own-file (`alternating-group-guards.ts`) rather than literal modification of `lms-guards.ts`. The eslint constraint is cleared; the new file joins the barrel; importers unaffected. Planner accepts: the rule's intent ("clear the cap") is satisfied; the literal "split `lms-guards.ts`" was a means, not an end.
- **#20 (commit count).** 6 commits instead of 5 — Stage 6 QA flagged a real test gap + 2 defensive cases that Stage 7 added; harness blocks `git rebase -i` so the tests landed in Commit 5 (`test(api-server)`) rather than amending Commits 2+3. Per-layer atomicity preserved; no squash; no skip-flags.

No substantive deviations against § 2 / § 3 / acceptance items 1-4, 6-19, 21. No scope drift into 8.2 / 8.3.5 / D-A2.

## Analysis-artifacts touched

`analysis/artifacts/06-formalization/implementation-notes.md` — §4.10 addendum only (operational semantics for D-A4 / D-A5 / D-A6 / D-A6.1). No shape file changed (`schema.prisma`, `types.ts`, `er-final.md`, `stress-final.md` byte-identical); `domain-model.md §7` and `edge-cases.md §6.5` already delegate to `implementation-notes.md` for the canonical shape. `analysis/artifacts/00-meta/**` untouched.

## Smoke-test status

**N/A** — api-server layer, no HTTP route, no UI. First runtime consumer = Step 8.2 (HTTP routes). UI smoke resumes Step 8.4 anchor.

## Process note

**Validation verdict: clean — Review APPROVE / QA PASS, all gates green, the load-bearing in-tx-read invariant for `lmsSchemaApi.delete` confirmed correct, prompt-spec adhered verbatim.** Step accepted.

Two zero-escalation cycles: the in-tx-plan-re-check spec-clarity micro-decision (executor resolved by reading the prompt intro authoritatively); the REVIEW-I3 split-axis choice (executor picked own-file over in-place split — cleaner, planner concurs).

**Strategic observation**: the D-A4 scope expansion — touching `lmsSchemaApi.delete` from an `lmsAlternatingGroupApi` step — was a planner-held line ratified in the thesis cycle. Execution validated the call cleanly: the in-tx race I flagged at prompt-write is precisely the case that out-of-tx reads would have missed, and the executor implemented the fix exactly per spec without needing to surface it. Pattern reinforced: prompt-time adversarial discipline (`[[planner-mutation-invariant-trace]]`) reliably catches what would otherwise be latent execution-time bugs — flavour (h) precedent expanded by one application.

QA-004 and QA-005 (Step 8.1c Stage-6 INFO carry-forwards) closed exactly as specified. REVIEW-I3 closed via own-file axis (`lms-guards.ts` byte-identical). QA-W1 (in-tx `plan.deletedAt` re-check for existing `lmsSchemaApi.delete` / `lmsSchemaRowApi.*` paths) stays deferred per prompt § 7. QA-E3 (`userId === undefined` propagation) stays deferred — `verifyAlternatingGroupOwnership` inherits the known sibling behavior.

**Next planner action**: Step 8.2 — platform HTTP routes for `Schema` / `SchemaRow` / `AlternatingGroup` api slices. The api-server vertical for `AlternatingGroup` is complete after 8.1d. See `state/04-next-action.md`.
