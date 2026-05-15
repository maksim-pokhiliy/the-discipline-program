# Implementation Log

> Append-only log of executed steps. Newest at the top.

## Entry format

```
## Step NN — <short title>

- **Date**: YYYY-MM-DD
- **Feature-dev artifacts**: `.feature-dev/<ts>/` (if `/feature` was used)
- **Prompt**: `implementation/step-NN/prompt.md`
- **Output**: `implementation/step-NN/output.md`
- **Summary**: 3-5 lines on what changed.
- **Open questions**: bullets raised during execution, status (resolved/deferred).
- **Deferred decisions**: deliberately postponed items.
- **Analysis/-files touched**: paths under `analysis/artifacts/05-synthesis/` or `06-formalization/` updated this step (or "none").
- **Smoke-test status**: passed/blocked/not applicable.
```

---

<!-- entries appended below this line, newest first -->

## Lesson learned (planner discipline)

**Strike pattern surfaced during Step 3** — six (6) deviations between prompt-spec and codebase patterns, all on the same dimension: my prompt encoded "TS best-practice instincts" rather than reading the codebase. Each was caught by the executor at Stage 1 / Stage 2 of `/feature` and resolved via rule 4 ("existing patterns are sacred"):

1. **D2** — server-side pagination spec vs codebase client-side (`z.array(entity)` cap=100 + `DataTable` client-paginate).
2. **D3** — multi-select `DataTableFilter` spec vs codebase single-value primitive (multi extension would touch shared `@repo/ui`).
3. **D4** — `.toISOString()` Date marshalling spec vs codebase raw `Date` + RSC payload.
4. **D7** — backend ILIKE search spec vs codebase client-side `Column.searchValue`.
5. **D10** — `Stack spacing={4}` per global memory vs project codebase `{3}` (41/61 occurrences).
6. **D11** — `z.nativeEnum(Equipment from @prisma/client)` spec vs `.dependency-cruiser.cjs` `contracts-no-prisma` rule + codebase mirror+bridge pattern (per `BLOG_CATEGORY` precedent).

**Rule for Step 4+ prompts**: before specing any cross-package boundary (mapper output, contract schema, API response, client API type, form field, list/filter/search behaviour, sidebar config), the planner **reads 2-3 canonical implementations verbatim** and quotes the pattern in the prompt with file paths + line ranges. No "TS best practice" instincts. Rule 4 supersedes any external convention. The executor's Stage 1 RFC should not be the first time codebase compatibility is checked — the prompt should already align.

**Step 3's `apps/admin/src/modules/exercises/` is now the canonical reference** for catalog-library admin CRUD (Step 4 Label CRUD, future entity catalogs).

**Addendum (Step 4)** — a 7th deviation surfaced, but a _new flavour_: not prompt-vs-codebase misalignment, but **prompt-internal contradiction**. The Step 4 prompt simultaneously specified (a) bounded-`as` mapper handling for `applicableLevels` (correct) and (b) an `enum-maps.ts` AppLevel bridge (wrong — `applicableLevels` is a `Json` column, not an enum column; the bridge would be dead code). Both can't be true. **Rule extension**: prompt self-review must check _internal consistency_ — every field's handling described exactly once, no contradictory instructions across scope-list / phases / ratified-decisions sections.

**Addendum (Step 5 — positive confirmation)** — read-then-spec paid off _at planning time_. The old Step 5 ("Platform plan list / create-plan flow") was a speculative queue entry written by a prior planner who had not read `apps/platform`. Reading platform's conventions verbatim — the explicit precondition for specing this surface — revealed the whole flow already exists as base LMS infrastructure. The step was dropped, not specced. Had the prompt been written from the queue title alone, the executor would have burned a `/feature` session to Stage-1-discover the feature already shipped. **The lesson is not only "read before you spec to get the patterns right" — it is also "read before you spec to confirm the work exists at all."** A queue entry is a hypothesis; the verbatim read is what tests it.

**Addendum (Step 5 — three executor deviations + one carry-forward)** — the re-numbered Step 5 (plan-detail shell, calendar viewport) shipped clean, but the executor caught three planner prompt bugs and one cross-cutting model boundary I had classified incorrectly. All three are read-then-spec failures of subtler kind than Step 3's:

1. **Write-back cache key construction.** The prompt said `useUpdateWeekNotes`'s `onSuccess` should write back via `formatDateParam(week.startDate)`. The executor noticed at L4 that `client.request` in this codebase **does not** coerce the response against the Zod schema (matches `training-plans.ts`), so `week.startDate` is a string at runtime, not a `Date` — `formatDateParam` would have produced a garbage key. Correct fix: write back via the `startDate` string the caller already passed into `mutate`. **Lesson**: when a contract uses `z.coerce.date()`, planner must check whether the client surface actually round-trips through the schema before assuming response fields are `Date`s.

2. **`description` conditional-spread vs `?? undefined`.** The prompt said pass `description={plan.description ?? undefined}`. `exactOptionalPropertyTypes: true` rejects explicit `undefined` — the codebase idiom is conditional-spread (`{...(value !== null && { description: value })}`), visible in `status-chip.tsx` and `InlineEditText`'s own `placeholder` handling. **Lesson**: planner can't reach for `?? undefined` instinctively under `exactOptionalPropertyTypes`; quote the existing pattern from the codebase.

3. **QA-001 (CRITICAL) — `@db.Date` ↔ local-midnight boundary.** The prompt said `Week.startDate`'s wire form was "byte-identical to `boardedAt`". Review classified the construction the same way. **Wrong** — `boardedAt` builds a `Date` from an ISO string (UTC-midnight), while `Week.startDate` builds it via `getMonday` / `parseDateParam`, which call `new Date(y, m, d)` (**local-midnight**). On a positive-UTC-offset server (`TZ=Asia/Kolkata` reproduces it), Prisma 6's `@db.Date` serialization via `toISOString()` shifts a local-midnight `Date` back by one calendar day. Fixed in Step 5 by `resolveWeekStartDate` in `endpoints/lms/week/admin.ts` (re-anchors the Monday to `Date.UTC(...)` before the Prisma boundary, in both `getByPlanAndDate` and `upsertNotes`). **Lesson**: "byte-identical to X" is a constructor-of-the-`Date`-matters claim, not a "same column type" claim — planner must inspect the constructor chain on both sides before reusing prior art.

4. **Hard carry-forward for Step 6+** — any future code path that writes a `Date` into a `@db.Date` column must apply the same UTC-midnight anchor. The first such path is Step 6: `Day` materialization upserts a `Week` row (per D6), so the same `Week.startDate` boundary fires. The Step 6 prompt must spec `resolveWeekStartDate`-style anchoring (reuse the helper directly if Step 6 imports `lmsWeekApi`'s internals, otherwise mirror the pattern). `@repo/shared`'s `getMonday` / `parseDateParam` are left local-midnight on purpose — they're correct for the client-side UI surface; the fix is api-server-boundary-local.

---

## Step 05 — Plan-detail shell (calendar viewport)

- **Date**: 2026-05-15
- **Feature-dev artifacts**: `.feature-dev/1778776411/` (`research.md`, `design.md`, `plan.md`, `tasks.md`, `review.md`, `qa.md`)
- **Prompt**: `implementation/step-05/prompt.md`
- **Output**: `implementation/step-05/output.md`
- **Summary**: First real training-domain surface in `apps/platform`. Replaced the `"Coming soon"` stub at `/coach/plans/[planId]` with a **calendar viewport** over plan weeks per **D6** (Week = lazily-materialized calendar slot, not a managed entity). Shipped a read-mostly `Week` vertical slice — contract slice (`lms/week`), `lmsWeekApi` (`getByPlanAndDate` returns `Week | null`, no 404 on unmaterialized slot; `upsertNotes` is the only write, materializes the row), `mapToWeek`, platform GET+PUT route (no POST/DELETE, no list endpoint), `useWeek` / `useUpdateWeekNotes`. Added `@repo/ui` `InlineEditText` primitive (later refactored to always-edit `InputBase`) + strictly-additive `PageHeader` extension (`editable`, `description`, `onTitleCommit`, `onDescriptionCommit`); built the `plan-detail` module (`PlanDetailView`, `WeekNavigator`, `WeekGrid`, `DayRow`, `WeekNotes`); resolved OQ-D (create-plan now lands the coach in `/coach/plans/<newId>`, not back on the list). 12 executor commits `2845244a..42787606`, 16/16 type-check/lint, 0 dep:check violations, 810 tests green (3 new test files). 5 user-directed post-validation tweaks (sibling-session direct commits, Step 4 precedent): `11a7c463` (`InlineEditText` edit mode → chromeless `InputBase`), `8cc8cf43` (`WeekNavigator` two-row reflow + MUI X `DatePicker` + "Today" folded into picker action-bar + `DateLocalizationProvider` client wrapper, since the root `layout.tsx` is a server component), `27be221c` (smoke-test sync), `e600c23c` (drop the display↔edit toggle from `InlineEditText` — always-edit semantics), `9d9389bd` (`WeekNotes` rendered as a plain `TextField`, not `InlineEditText`). Two further planner-side cosmetic commits at close-out (`3dc40feb` editable `PageHeader` h2/body1; `169d5086` `WeekNavigator` `alignItems="flex-end"` consolidation).
- **Open questions** (3 executor-caught planner-prompt bugs, all resolved):
  - **L4 write-back key (deviation #1)** — `useUpdateWeekNotes` writes back via the caller's `startDate` string, not `formatDateParam(week.startDate)` (the latter would produce a garbage key because `client.request` does not validate response). Single-line why-comment in `use-weeks.ts`.
  - **`description` conditional-spread (deviation #2)** — `PlanDetailView` uses `{...(plan.description !== null && { description: plan.description })}` because `exactOptionalPropertyTypes: true` rejects explicit `undefined`; matches the codebase idiom.
  - **QA-001 (deviation #3, CRITICAL)** — `Week.startDate` is re-anchored to `Date.UTC(...)` at the api-server boundary via `resolveWeekStartDate`. Proven with `TZ=Asia/Kolkata pnpm --filter @repo/api-server test src/endpoints/lms/week/admin.test.ts` (green; pre-fix the value-assertion failed `expected 17 to be 18`). See the "Lesson learned" Step 5 addendum for the full diagnosis and the Step 6 carry-forward.
- **Deferred decisions** (from QA / Review):
  - **QA-003 (WARNING)** — `useUpdateWeekNotes` has no `invalidateQueries`/`mutationKey`. Accepted as-is: `setQueryData` with the authoritative server response is correct for a single-user blur-commit surface; two rapid saves on the same week would briefly desync the cache but heal on the next fetch.
  - **QA-005 (WARNING)** — `InlineEditText` has no client-side `maxLength` cap; over-length pastes trigger a server-400 → toast → lost edit. Follow-up; coach still sees an error toast (not silent).
  - **QA-002 (INFO)** — no dedicated `parseDateParam` / `getMonday` unit tests in `@repo/shared`; the reject path is covered indirectly through `lmsWeekApi`. Pre-existing surface, out of step ownership.
  - **QA-007 / QA-008 / QA-009 (INFO)** — `notes` UTF-16-code-unit cap (codebase-wide), 404-vs-403 oracle in `verifyPlanOwnership` (codebase-wide, pre-Step-5), `PlanDetailView` swallows `useWeek` errors (narrow: healthy plan-GET + failed week-GET → empty notes panel without error-toast). All pre-existing or completeness-level.
  - **Review WARN-2 (INFO)** — the single code comment in `use-weeks.ts` is ~147 chars; cosmetic.
  - **QA-001 (CRITICAL — carry-forward to Step 6+)** — `Day` materialization upserts a `Week` row (D6) and re-enters the same `@db.Date` ↔ local-midnight boundary. Step 6 prompt must spec `resolveWeekStartDate`-style UTC anchoring. The deferred default for any future step writing a `Date` into a `@db.Date` column is **the same**: anchor to `Date.UTC(...)` at the api-server boundary; leave `@repo/shared` local-midnight helpers untouched (correct for the client surface).
- **Analysis/-files touched**: `analysis/artifacts/05-synthesis/domain-model.md` §1.0 (Week — prose clarified to the lazily-materialized calendar-slot framing under D6; no schema change, no `06-formalization/` touch).
- **Smoke-test status**: **passed** (2026-05-15) on the final post-validation HEAD (`169d5086` after the close-out cosmetic commits). All 15 scenario steps green: 7-row Mon–Sun layout with today's highlight circle, prev/next/today/jump-to-date via the MUI `DatePicker`, `?week=` survives refresh, week-notes upsert materializes the row and clears with `null`, inline title/description edit (empty-title reverts; empty-description saves as `null`), create-plan lands in `/coach/plans/<newId>` on the current calendar week. Step 5 fully closed.

## Step 05 — Plan list / create-plan flow — DROPPED (already implemented)

- **Date**: 2026-05-14
- **Feature-dev artifacts**: none — no `/feature` run; no executor session.
- **Prompt**: none written.
- **Output**: none.
- **Summary**: The queued Step 5 ("Platform plan list / create-plan flow — replace/verify `apps/platform/src/modules/plans/` scaffolding") was found, on a verbatim read of `apps/platform`, to be already fully implemented as **pre-existing base LMS infrastructure** — not workflow scaffolding. Present and functional: `modules/plans/` (`PlansView`, `PlansListSection` with URL-synced status tabs, `PlanCard`, `PlanActionMenu`, `CreatePlanDialog`), `lib/hooks/use-training-plans.ts` (full CRUD via `createCrudHooks` + status mutations), `lib/api/endpoints/training-plans.ts`, `lib/api/keys.ts`, all `app/api/platform/training-plans/...` routes (list/create/getById/update/delete/activate/archive/restore), `packages/contracts/.../lms/training-plan/` (full contracts), `packages/api-server/.../training-plan.ts` + `training-plan.mapper.ts`, `lib/config/navigation.ts` (`/coach/plans` present), seed (`coach@thedisciplineprogram.com` / `password12345` + 4 plans across all statuses). The training-domain workflow's only change to this surface was the `weeks Week[]` back-relation on `TrainingPlan` (Steps 1-2), which touches neither the contract, the create flow, the mapper, nor any plans UI. There was nothing to spec. User decision (2026-05-14): drop the step, renumber old Steps 6-12 → 5-11.
- **Open questions**: two side-observations surfaced during the read, both recorded in `PLANNING_STATE.md` (one in the new Step 5 description, one in § "Deferred sub-decisions"):
  - **Create-plan redirect** — `createCrudHooks` is configured `redirectTo: "/coach/plans"`, so creating a plan returns the coach to the list rather than landing them in the new plan. Hypothesis: once plan-detail is non-stub, create should land in `/coach/plans/[newId]`. Folded into the new Step 5 (plan-detail shell) scope.
  - **No plan edit/rename UI** — `useUpdateTrainingPlan` / `applyTrainingPlanUpdate` / `updateTrainingPlanSchema` / PUT route all exist, but `PlanActionMenu` has no edit affordance. Hypothesis: plan-metadata editing belongs in the plan-detail header, not a list-level dialog. Deferred; revisit during the plan-detail shell.
- **Deferred decisions**: none.
- **Analysis/-files touched**: none.
- **Smoke-test status**: not applicable (no code change). The existing plan list / create flow has not been independently smoke-tested against the post-Step-2 reseeded DB; that verification folds naturally into the new Step 5 smoke-test (navigating plans → plan-detail is a precondition for testing the plan-detail shell).

## Step 04 — Admin Label CRUD

- **Date**: 2026-05-14
- **Feature-dev artifacts**: `.feature-dev/1778744240/` (research, design, plan, tasks, review, qa)
- **Prompt**: `implementation/step-04/prompt.md`
- **Output**: `implementation/step-04/output.md`
- **Summary**: Second admin catalog-library CRUD — Label. Structural mirror of Step 3 Exercise module, adapted from 10-field Exercise to 3-field Label (`name`, `applicableLevels`, `notes`). One new pattern — `applicableLevels` multi-value checkbox widget (`FormGroup` + 3 `Checkbox`), `Controller` subscribed to `fieldState` with `FormControl error` + `FormHelperText` (direct copy of the Step 3.1 `placeholderFlag` fix — regression guard for the silent-submit bug). 9 commits `6a8b2302..252d7323`. No schema change (Label + AppLevel shipped in Step 2). 786 tests passing (+33: 22 contract unit + 11 api-server integration). Review APPROVE 0/0/0, QA A−. `enum-maps.ts` NOT touched (DEC-7).
- **Open questions** (3 escalations, all resolved):
  - **Trigger-2 (memory prior-attempt vocab)** — `feedback_discipline_db_non_prod.md` had a stale ADR-0037/plan-editor breadcrumb. Resolution: surface-only (per Step 1 precedent); planner cleaned the memory file in parallel (removed breadcrumb + corrected stale `db:reset` definition that wrongly included `&& prisma db seed`). Re-grep of memory dir confirmed zero remaining stale refs.
  - **enum-maps.ts dead-code** — prompt specified an AppLevel bridge in `enum-maps.ts`, but `applicableLevels` is a `Json` column (mirrors Exercise `aliases Json` — no bridge). Planner-side prompt error (internal contradiction — see Lesson learned addendum). Resolution: skip `enum-maps.ts` (DEC-7); append-only edits 8 not 9.
  - **QA-001 (duplicate applicableLevels)** — `["DAY","DAY"]` passed write+read schemas; UI checkboxes can't produce dups but direct API / edit-reseed bypass that. Fixed (`4c9c922a`): field-level `.refine` uniqueness on `applicableLevelsSchema`.
- **Deferred decisions** (from QA):
  - QA-002 (`notes: ""` not normalized to `null`) — codebase-wide pattern shared with Exercise; fix codebase-wide or leave, not in isolation.
  - QA-003 (`as AppLevelValue[]` mapper narrowing) — ratified pattern (mirrors Exercise `aliases`); guarded by integration test asserting read-path throws `ZodError` on malformed data.
  - Separate sidebar icon for "Labels" — currently shares `"exercises"` icon; ~2-line `icon-map.ts` addition, out of Step 4 scope.
- **Analysis/-files touched**: none (no schema change).
- **Smoke-test status**: **passed** (2026-05-14). 9-step scenario green, including the step-4 regression guard (empty `applicableLevels` surfaces an inline error, not a silent no-op). Two user-directed post-acceptance tweaks committed via a separate session: `6f4b033f` (distinct sidebar icon for Labels — closes the deferred DEC-5 shared-icon item) and `b7defec9` (label form split into two cards — supersedes DEC-3 flat-single-card, user preference). Step 4 fully closed.

## Step 03 — Admin Exercise CRUD (with Phase 0 D5 refinement)

- **Date**: 2026-05-13
- **Feature-dev artifacts**: `.feature-dev/1778666831/` (research.md, design.md, plan.md, review.md, qa.md, tasks.md)
- **Prompt**: `implementation/step-03/prompt.md`
- **Output**: `implementation/step-03/output.md`
- **Summary**: Phase 0 ratified D5 (`Exercise.defaultDemoUrl String?` → `defaultDemoUrls String[]`) across analysis-artifacts + real schema; `db:reset+seed` clean. Phases 1-7 shipped first user-visible admin CRUD: contracts (mirrored enums per dep-cruiser `contracts-no-prisma` rule), backend handlers with `P2002`/`P2003` intercepts, 4 admin routes, client API + TanStack hooks, admin module (form split into 4 sub-cards + 2 helpers per `react/no-multi-comp`), 3 pages, new `Library` sidebar group. Stage 5/6 hardening: NFKC normalize + zero-width strip, http(s)-only URL scheme refine, length/array caps (`MAX_URL_LENGTH=2048`, `MAX_NOTES_LENGTH=10_000`, `MAX_ARRAY_LENGTH=20`), cross-field placeholder consistency refine. 12 commits on `feat/training-domain` (HEAD `51302f93`). 753 tests passing (+25); type-check/lint/dep:check all 16/16 green.
- **Open questions**:
  - **Memory hygiene** flagged by planner this turn — `feedback_localized_helper.md` is admin-v4 cross-pollution; `feedback_pattern_compliance.md` Stack spacing should note discipline-specific `{3}` override. Both pending user approval.
  - **Browser smoke-test** scenario documented in `step-03/output.md` §"Сценарий смоук-теста"; awaiting user execution.
- **Deferred decisions** (from executor's Stage 6 QA):
  - **QA-008** server-side pagination — defer until library > ~500 entries; cross-cutting refactor on all admin CMS endpoints simultaneously.
  - **QA-010** `canonicalCompoundType × placeholderFlag` dual-encoding collapse — long-term schema migration (drop flag, derive on read).
  - **QA-011** `ConfirmationModal` stuck open on delete-error — project-wide pattern in `useDeleteConfirmation`; fix once for all modules.
  - **QA-012** Server-validation errors not inline on input — project-wide; centralized fix in `createCrudHooks` `setError` chain.
  - **`aliases Json? → String[]`** schema migration — bounded `as string[] | null` narrowing in mapper this step; future symmetry with `defaultDemoUrls`.
  - **`defaultLoad` UI surface** — nullable in schema; no form input this step; future schema-extension step.
  - **Multi-select `DataTableFilter` primitive** — `@repo/ui` extension; needed by plan-builder picker (Step 9+).
  - **`stress-final.md` / `00-meta/phase-06-prompt.md` stale `defaultDemoUrl` mentions** — out-of-scope per prompt §2/§3; paper trail in output.md.
  - **Production rollout workflow** — separate ADR when prod migrates off Neon dev.
- **Analysis/-files touched**: `06-formalization/{schema.prisma, implementation-notes.md, er-final.md}` (Phase 0 D5 refinement only).
- **Smoke-test status**: passed (2026-05-13). 10 of 11 scenario steps green on first run; step 8 (cross-field refine UX) silently failed — refine fired at resolver but Switch field did not surface error. Fixed inline via commit `919b836d fix(exercise): surface cross-field refine error on placeholder flag toggle` (`classification-card.tsx` placeholderFlag Controller now subscribes to `fieldState` and renders error in `FormHelperText`, matching the `canonicalCompoundType` Select pattern in the same file). Re-test passed both directions (PLACEHOLDER+off and ATOMIC+on). Step 3 fully closed.

## Step 02 — Prisma Schema Port + Archetype Seed

- **Date**: 2026-05-13
- **Feature-dev artifacts**: `.feature-dev/1778644165/` (`research.md` + `review.md`)
- **Prompt**: `implementation/step-02/prompt.md`
- **Output**: `implementation/step-02/output.md`
- **Summary**: Training-domain срез из `analysis/artifacts/06-formalization/schema.prisma` ported into `packages/api-server/prisma/schema.prisma` — 11 enums + 14 models + 3 back-relations on existing `User`/`TrainingPlan`. `OneRMRecord.valueKg` = `Decimal @db.Decimal(6, 2)`. All `@@map("training_*")`. 34 canonical archetypes seeded (split into 4 family files per ESLint `max-lines: 300`). Exercise/Label tables empty per D4. `prisma format/validate/generate` ✓, `db:reset + db:seed` ✓, 16/16 workspaces type-check + lint clean, 728/728 tests passed.
- **Open questions**:
  - **`db:reset` script ≠ auto-seed** in this repo. Real script = `prisma db push --force-reset && tsx scripts/apply-sql-checks.ts`. Executor compensated by calling `db:seed` separately. Implication for future prompts: when planner says "db:reset" assume it needs explicit `db:seed` follow-up.
  - **`archetypeParamsSchema` source = `types.ts` `ArchetypeParams` discriminated union** (not `implementation-notes.md` — that file covers only 2/34 archetypes in full template form). Acceptable derivation per Step 1 ratification; not fabrication.
- **Deferred decisions**:
  - `Exercise` / `Label` seed — Step 3 / Step 4 implement via admin UI (D4).
  - `Week / Day / Session / Block / Schema / SchemaRow` content seeding — out of scope per D3 (full-schema port ≠ full content seed).
  - `OneRMRecord / PerformedSession*` seeding — out of scope (athlete-flow out).
  - `citext` migration for case-insensitive uniques — explicit defer; current lowercase-mirror pattern stays.
  - Versioned migrations directory — per ADR-0019, not maintained during workflow.
- **Analysis/-files touched**: none (Step 2 is pure port, no model refinement).
- **Smoke-test status**: passed (db:reset + db:seed, table populations verified: archetypes=34, exercises=0, labels=0, training\_\*=0, users=13, lms_training_plans=4).

## Step 01 — Model Ratification

- **Date**: 2026-05-12
- **Feature-dev artifacts**: N/A (no `/feature`; pure docs/spec edit)
- **Prompt**: `implementation/step-01/prompt.md`
- **Output**: `implementation/step-01/output.md`
- **Summary**: Applied D1-D4 ratifications across 6 analysis-artifacts. `schema.prisma` got `Week` model + `DayOfWeek` enum + stub `User`/`TrainingPlan`, `Day` rewritten (drop `order`, add `weekId`+`dayOfWeek`), `Athlete` model removed, FK `athleteId→userId` on `OneRMRecord`/`PerformedSession`. ER-diagrams synced; `implementation-notes.md` got dated §0 with ratifications + OPEN-items closed. `types.ts` minimal cleanup. Validated via `prisma format`.
- **Open questions**:
  - **Memory entries про прошлые попытки** (ADR-0037/0041/0042/0043 + feedback_coach_always_edit_mode) — executor surfaced без halt; cleanup requested via user approval (this conversation turn).
  - **Order semantics divergence** — pre-existing inconsistency between `er-final.md §5 #7` (sparse 10/20/30, Phase 4 Q6 ratified) and `PLANNING_STATE.md` deferred-default (sequential 1,2,3). Resolved: `PLANNING_STATE.md` reverts to **sparse 10/20/30** per Phase 4 Q6. No analysis-artifact edit needed (Phase 4 Q6 was already ratified). To be reflected in Step 2 seed.
- **Deferred decisions**:
  - Pseudocode rewrite of `implementation-notes.md §3.5 resolveDualValue` / §3.8 resolveHrZoneToBpm — requires finalized AthleteProfile columns (Phase 8+).
  - Real Prisma client regeneration — happens in Step 2 (port to `packages/api-server/prisma/schema.prisma`).
  - 149-exercise / 19-label starter-pack delivery format (CSV import in admin? on-demand seed command? manual entry?) — Step 2+ decides.
- **Analysis/-files touched**:
  - `analysis/artifacts/06-formalization/schema.prisma`
  - `analysis/artifacts/06-formalization/er-final.md`
  - `analysis/artifacts/06-formalization/implementation-notes.md`
  - `analysis/artifacts/06-formalization/types.ts`
  - `analysis/artifacts/05-synthesis/domain-model.md`
  - `analysis/artifacts/05-synthesis/er-diagram.md`
- **Smoke-test status**: N/A (no UI/runtime impact).
