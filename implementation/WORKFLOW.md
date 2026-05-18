# Training-Domain Implementation Workflow

> Durable workflow rules + lessons learned. Read this FIRST when resuming as planner or starting as executor. This file does not change per-step (unlike `PLANNING_STATE.md`); update it only when a workflow rule itself changes.

## Context

`analysis/` holds artifacts produced over ~2 days / ~20 sessions, turning the coach's `analysis/source/plan.xlsx` into a domain model. This workflow integrates that model into the monorepo across every layer: Prisma schema → admin catalog CRUDs → platform plan editor.

**This is the 4th attempt.** The previous three failed from weak domain design, rushing, single-session no-planning. Prior code was deleted; prior memory entries purged. **Do NOT search git history or memory for prior-implementation details.** If a trace surfaces (vocab like `SchemeType`, `SETS_REPS as 9th archetype`, `per-block atomic save`, `coach always edit mode`, `plan-editor rollback`, ADR-0037/0041/0042/0043), **STOP and surface to the user** — likely a delete task follows. The single legitimate model source is `analysis/artifacts/` until ported into `packages/api-server/prisma/`.

## Workflow completion criteria

The workflow is done when this end-to-end coach happy path works:

1. Domain model ported from `analysis/` into `packages/api-server/prisma`.
2. CRUD tables for catalogs (Exercise, Label, …) in `apps/admin`, following existing module conventions.
3. Plan editor in `apps/platform/src/modules/plan-detail/` with week-based navigation (week view primary; monthly/daily views discussed separately).
4. Coach can: create catalog entities in admin → create a plan in platform → programme a week with realistic sessions → data persists per the Prisma schema.
5. Athlete flow is NOT built. Acceptable to extend the Prisma model with athlete-facing entities and seed minimal data so smoke-test paths aren't broken.

Everything beyond (athlete flow, analytics, UX optimization) is a separate workflow.

## Roles

- **Planner session** — designs the integration strategy, breaks it into steps, writes a self-contained `implementation/step-NN/prompt.md` per step, validates each executor's output, maintains the working-memory files. Does NOT write production code (small inline bug-fixes to already-shipped step output are acceptable; net-new feature code is the executor's job).
- **Executor session** — a fresh Opus 4.7 max-effort session per step. Reads `implementation/step-NN/prompt.md`, executes (usually via `/feature` or `/feature small`), writes `implementation/step-NN/output.md`.
- The **user shuttles** prompts and outputs between the two. The user runs browser smoke-tests for UI steps.

## Per-step cycle

1. Planner drafts **тезисы** (thesis) for the step: Goal · Inputs · Outputs · Acceptance criteria · Known risks & open questions (each open question stated **with a hypothesis** — "here's what surfaced; from a coach's view it's probably X; right?").
2. User reads, asks/adjusts. When both agree — planner writes the full prompt to `implementation/step-NN/prompt.md`.
3. User carries the prompt path to a fresh executor session.
4. Executor runs the step, writes `implementation/step-NN/output.md`, commits per-layer on `feat/training-domain`.
5. User reports completion. Planner reads `output.md` (+ `.feature-dev/<ts>/` if `/feature` was used), spot-checks artifacts, validates.
6. For UI steps: user runs the smoke-test scenario in a browser.
7. Step is **closed** only when planner + user both accept it. Planner updates `IMPLEMENTATION_LOG.md` and `PLANNING_STATE.md`.

Each step runs through `/feature` (or `/feature small` for trivial 1-3-file no-schema steps). The step prompt is the entry into the skill's Research stage.

## Working-memory files

- `implementation/WORKFLOW.md` — this file. Durable rules + lessons. Rarely changes.
- `implementation/PLANNING_STATE.md` — current step, step queue, open questions, accepted decisions (D1, D2, …). **Changes every step.** Authoritative live state.
- `implementation/IMPLEMENTATION_LOG.md` — append-only journal: per-step date, `.feature-dev/<ts>/` link, 3-5 line summary, open questions, deferred decisions, analysis-files touched, smoke-test status. Newest entry first. Has a "Lesson learned" meta-block at the top.
- `implementation/step-NN/prompt.md` — the step's prompt.
- `implementation/step-NN/output.md` — the step's output report.

## Session handoff protocol

A fresh planner session resumes by reading, in order:

1. `implementation/WORKFLOW.md` (this file)
2. `implementation/PLANNING_STATE.md`
3. `implementation/IMPLEMENTATION_LOG.md`
4. `analysis/artifacts/05-synthesis/` + `analysis/artifacts/06-formalization/` (the living model source)

Then it picks up at `PLANNING_STATE.md` § "Next action".

## `output.md` format (executor produces)

Section headers, in Russian prose where natural, English for code/paths:
`## Что сделано` · `## Изменённые/созданные файлы` · `## Принятые решения` · `## Возникшие вопросы и как решены` · `## Что отложено` · `` ## Ссылка на `.feature-dev/<ts>/` `` · `## Сценарий смоук-теста` (UI steps only) · `## Verification notes` · `## Acceptance criteria self-check`.

## Smoke-test scenario format (for UI steps)

Must contain: preconditions (DB state, which seed) · numbered user steps · expected result after each step · how to roll back state. "Open the screen and try it" is NOT a valid scenario.

## `analysis/` directory rules

Three categories:

- **Read-only forever** (historical design artifacts): `analysis/source/`, `analysis/artifacts/00-meta/`, `01-inventory/`, `02-patterns/`, `03-content/`, `04-structure/`.
- **Living source of truth** (updated in sync with schema changes): `analysis/artifacts/05-synthesis/`, `analysis/artifacts/06-formalization/`.
- A step that changes the Prisma schema updates, in the same session: `06-formalization/schema.prisma`, `06-formalization/er-final.md` (if relations/cardinalities change), `05-synthesis/domain-model.md` (if entity semantics change), `06-formalization/implementation-notes.md` (short record of what changed and why). Stress tests (`05-synthesis/stress-test.md`, `06-formalization/stress-final.md`) update only if the change is driven by a case the old model didn't cover. `IMPLEMENTATION_LOG.md` gets an explicit "analysis-files touched: X, Y, Z" note.

## Domain-model change protocol

The model in `analysis/` is not final — its limits will surface and must become improvements. **If a step hits a model limitation — STOP.** Do not silently adapt the model inside the step. Instead: (1) state the change thesis with a hypothesis ("the coach probably thinks about this as …"), (2) return to the planner, (3) the schema change becomes its own ratified sub-step, (4) the `05-synthesis/` + `06-formalization/` files are updated per the rules above. No forcing the model to fit; no ignoring limits; no inventing. Smallest doubt → escalate.

## DB migrations & seed

DB is non-prod Neon dev. Per ADR-0019, no `migrations/` folder during this workflow — each schema change is `pnpm --filter @repo/api-server db:reset` (which runs `prisma db push --force-reset && tsx scripts/apply-sql-checks.ts` — it does **NOT** auto-seed) followed by an explicit `pnpm --filter @repo/api-server db:seed`. Versioned migrations are not maintained until the workflow ends.

Any step adding/changing a Prisma entity updates the seed in the same session — minimum: one coach, one athlete, one plan, one week with realistic sessions — so the smoke-test stays valid. Exception ratified as D4: `Exercise` and `Label` are libraries (coach-populated via admin UI, not seeded); `Archetype` is configuration (34 canonical entries seeded, no admin CRUD).

## Architectural orientations

- **Catalogs/libraries** live in `apps/admin` as table modules, mirroring the 10+ existing ones. Table + form, CRUD, nothing novel. `apps/admin/src/modules/exercises/` (Step 3) is the canonical reference template for catalog-library CRUD.
- **Plan editor** lives in `apps/platform/src/modules/plan-detail/` (currently a stub). Primary view is the WEEK, with week-by-week navigation.
- **Athlete platform** is NOT built in this workflow.

## Language & commit conventions

- Code, comments, commits, PRs, technical artifacts — English. Chat-prose with the user — Russian. Domain terms per `analysis/artifacts/06-formalization/`.
- No comments in code unless they encode a non-obvious _why_ (single line). Schema-DSL section markers are deliberate exceptions.
- No `Co-Authored-By` / `Generated-with` / similar trailers anywhere.
- Commits: `feat/training-domain` is a single long-lived branch, per-layer (not squashed) commits **by default**. Conventional-commits format. **Commitlint enforces: subject ≤ 100 chars, fully lowercase (no capitals anywhere, including acronyms — `d5` not `D5`), body lines ≤ 150 chars.** Never `--no-verify` / `--no-edit` / `--no-gpg-sign` — if a hook fails, fix the root cause.
- **Squash exception** (per `[[husky-cross-package-squash]]`, Step 6.1.5 + 6.2): when a step's planned intermediate state would leave **any downstream package** broken under `.husky/pre-commit` (`turbo check-types --filter="...[HEAD]"`) — typically a cross-package contract response shape change — squash all phases into one commit, body listing per-layer changes for logical revertability. Deprecation-shim alternatives are anti-pattern (they import in directions forbidden by sibling dep-cruiser rules). Before drafting any step's § 7 commit strategy, read `.husky/{pre-commit,pre-push}` + `turbo.json` to confirm hook gates and fan-out.

## Forbidden

1. Searching git history or memory for prior-implementation details (4th attempt; priors deleted). Trace found → STOP + surface.
2. Editing `analysis/source/` or `analysis/artifacts/{00-meta,01-inventory,02-patterns,03-content,04-structure}/` without explicit user agreement.
3. Editing the Prisma schema without planner agreement (via thesis + approved prompt).
4. Asking questions without a hypothesis for the answer.
5. Silencing domain-model limitations.
6. Inventing UX behaviour or domain-object semantics. Hit a knowledge gap → STOP, formulate the question with a hypothesis, wait for the planner.

## Obligatory

1. Ask questions whenever something is unclear, doesn't add up, or looks anomalous.
2. Think like the coach when a task touches coach-user behaviour or domain-object semantics.
3. Phrase questions with a hypothesis ("this surfaced; from the coach's view it's probably X — right?"). This pulls the Opus model deeper into the context, not just code-writing.

## Allowed

1. Studying the whole codebase, unless the step prompt says otherwise.
2. Asking any number of questions, remembering the hypothesis rule.

## Lessons learned (planner discipline)

Seven "read/verify-then-spec" procedural checklists accreted across Steps 1-7.3.5 (full per-step diagnoses in `IMPLEMENTATION_LOG.md` per-step "Open questions" + "Process note" footers):

1. **(a) Canonical codebase patterns** — [[scope-via-existing-patterns]]. Step 3 strike. Before specing a cross-package boundary (mapper output, contract schema, API response, client API type, form field, list/filter/search behaviour, sidebar config), read 2-3 canonical implementations verbatim and quote them with file paths + line ranges. No "TS best practice" instincts — project patterns are sacred.
2. **(b) Domain semantics** — [[coach-pov-first]]. Step 6 thesis cycle. Before specing a domain field or operation, cite `analysis/artifacts/` verbatim. No citation → field is engineer-cargo or genuinely deferred → escalate, don't invent.
3. **(c) Registration-file completeness** — [[planner-verbatim-registration]]. Step 6.0 CONTEXT-001. For barrels, `package.json` exports, app routers, sidebar config, dep-cruiser arrays, `pnpm-workspace.yaml`, `turbo.json` — `Read` verbatim at **prompt-write time** (not thesis time). Quote current state in full; state additive intent explicit; show final state in full.
4. **(d) Engineering correctness under adversarial input** — [[planner-adversarial-review]]. Step 6.1 QA-001/002. Before locking § 3 with write ops, run mental sweep: concurrent / TOCTOU / partial inputs (subset / superset / empty / duplicates) / malformed / boundary. Each axis ~30 seconds.
5. **(e) Commit-strategy correctness under live hook config** — [[husky-cross-package-squash]]. Step 6.1.5 D-OUTPUT-1. Before locking § 7, read `.husky/{pre-commit,pre-push}` + `turbo.json`. Cross-package change with intermediate broken trees → squash into 1 commit with per-layer body. Never bypass hooks. Deprecation-shim is anti-pattern.
6. **(f) Consumer-pattern completeness for contract response shape changes** — [[planner-consumer-pattern-read]]. Step 6.2 CONTEXT-001 + Step 7.3.5 D-1. When extending a contract response shape, read every HTTP route handler + client API endpoint + client hook/adapter + downstream mapper that consumes it, verbatim. Handlers may manually wrap / transform / validate; cascades into double-wrap or parse-fail if not adjusted in the same change. **Mapper-side application**: when widening a Prisma include type, § 0.A grep enumeration must include `grep -rn "<mapperName>" packages/api-server/src/` для каждого mapper touched в step — every callsite produces a contract object that now requires the new field. Single mapper consumed by 2-3 endpoints is the typical Day/Week chain pattern (see Step 7.3.5 D-1 for the application miss — recovery clean через `AskUserQuestion`).
7. **(g) Read-surface trace for UI step planning** — [[planner-read-surface-trace]]. Step 7.4 thesis-time finding (2026-05-18; Step 7.3.5 = enabler recovery step). Before locking any UI step thesis, trace the read path **backwards** from displayed entities: which hook fetches them? which query key? which API method? which HTTP route? Does the response shape include the entity OR is there a dedicated GET endpoint? If gap — **STOP**, surface, queue read-enabler sub-step before UI. Adjacent to (f) which catches shape **change** misses; (g) catches ship-write-without-read **omission**. Different failure modes, related root: read-path not part of write-step planning. Anti-precedent: 4 sub-steps of Block write surface shipped (7.0 contracts → 7.1 api-server → 7.2 routes → 7.3 client hooks) before planner realized at Step 7.4 thesis-time that `sessionWithLabelSchema` lacked `blocks: Block[]` embed AND no separate GET existed. Step 7.3.5 read-surface enabler then became necessary.

None is optional. Seven together = procedural checklist; the collaboration rule ([[collaboration-co-ownership-claude-md]]) sets the stance.

Adjacent bindings:

- **Prompt-internal consistency** (Step 4 finding) — every field handled exactly once; no contradictory instructions across scope-list / phases / ratified-decisions sections.
- **Memory hygiene** (Step 1 + Step 6.1.5) — when deleting memory entries, `grep` survivors for cross-references; after any namespace-affecting refactor (e.g. Step 6.1.5 cms→lms), sweep memory dir for stale path references and update.
- **Executor escalation protocol** — surface-with-hypothesis-and-wait, never silently comply with a wrong prompt. Planner answers fast, owns prompt errors, records them. Prior precedents: Step 6.0 CONTEXT-001 (barrel drift), Step 6.1.5 Q1 (husky strategy mismatch) + Q2 (admin-import miss), Step 6.2 CONTEXT-001 (route-handler manual-wrap).
- **Postgres SSI write semantics** ([[postgres-ssi-upsert-unique-key]], Step 6.2 case 13) — concurrent `prisma.$transaction(..., Serializable)` upserts on same unique key fail P2034 even with disjoint UPDATE columns (SSI is row-grained). Test design: pre-materialize then UPDATE; production: retry-on-P2034 at HTTP layer.
