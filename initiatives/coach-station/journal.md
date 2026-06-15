# coach-station — journal

Append-only. One entry per session/step.

## 2026-06-15 — initiative founded (planning session, isolated worktree)

- **Context.** Phase 2 ("Coach station complete") opened as a new initiative while session-primitive (Phase 1) is being hand-driven through its e2e in a parallel session. To not lose time, this initiative runs in an **isolated git worktree** (`worktree-coach-station`, branched from `origin/main` = `9726729c`, which carries the full frozen primitive + catalog pass #269). `initiatives/ACTIVE` in `main` stays `session-primitive`.
- **Read (SSOT, not invented).** `docs/roadmap.md` §Phase 2/3, `docs/process.md`, `docs/planner-discipline.md`, `initiatives/README.md`, session-primitive `primitive-spec.md` (FROZEN) / `decisions.md` / `deferred.md`, `docs/personas/denys.md`, and the written `e2e-evil-corpus.md` (the live Phase-1 gate, which feeds A-e2e polish).
- **Recon (2 read-only Explore agents over main).** (1) Reuse is GREENFIELD — zero clone/duplicate/template capability anywhere; the training hierarchy is `TrainingPlan → Week → Day → Session → Block → Schema(+SchemaGroup) → SchemaRow(+RowGroup)`; Week/Day are calendar-keyed (no `order`, upsert-on-demand), Session/Block/Schema/Row carry `order` (Block + Row `@@unique([parent,order])`); creates are per-level (session-create seeds a block). (2) Coach profile backend is ALREADY shipped (GET/PUT `/api/platform/coach/profile`, `coachProfile` with only `bio`, `withCoachAuth`); route stub + nav exist; gap = client hook + form.
- **Ratified (owner).** D-1 ONE-INITIATIVE · D-2 CLONE-FIRST (templates parked, not dropped) · D-3 CLONE-SERVER-SIDE (owner-delegated technical call) · D-4 CLONE-FLOORS (verbatim per-floor semantics — week/day replace-into-current; session↓ duplicate-append; groups clone members only) · D-5 PROFILE-SCOPE (bio + user-meta, off-spine, owner-delegated).
- **Scaffolded** `initiatives/coach-station/` (charter / plan / state / decisions / deferred / journal) from `_template`; set ACTIVE locally in the worktree.
- **Next.** Design the R1 clone UX via the `ui-ux-pro-max` plugin → write the R1 `/feature` prompt.

## 2026-06-15 — R1 clone UX designed (`r1-clone-design.md`)

- **Recon (Explore agent over the worktree).** Mapped the plan-editor tree (`PlanDetailView → WeekNavigator → WeekGrid → DayRow → SessionCard → BlockCard → BlockCardBody → SchemaCard/SchemaGroupBox → SchemaRowList → RowGroupBox/SchemaRowCard`), the per-floor action clusters (drag … edit `TuneIcon` … delete `DeleteIcon`/error), `WeekNavigator` (prev/next + DatePicker + Today), `ConfirmationModal` (danger/warning/info), `PlusRowButton`. Zero existing clone affordances — greenfield. Exact insertion points captured.
- **`ui-ux-pro-max` consulted** (ux domain): confirm-before-destructive, undo-for-destructive, success-toast (auto-dismiss), loading/disabled states, aria-label for icon-only, empty-state messaging, color-not-only.
- **Wrote `r1-clone-design.md`** (DRAFT): affordances per floor (`ContentCopyIcon`, after edit / before delete), the two flows, microcopy, interaction states, a11y, and a D-3 server-contract sketch (`clone-from` = replace; `duplicate` = append). Five UX forks raised for owner ratification (§9).
- **Next.** Owner ratifies the §9 forks → write the R1 `/feature` prompt (one wave, or split server-engine + editor-UX per the W4 rhythm).

## 2026-06-15 — R1 clone UX RATIFIED (D-6) + R1 split

- **Owner ratified the 5 §9 forks → D-6:** no undo (danger-confirm only) · block empty sources in the picker · silent duplicate-append · any week as source · any day as source. `r1-clone-design.md` §9 + the undo references in §3/§5/§6 updated to match.
- **R1 split decided (orchestrator, owner-delegated process call): R1a server-engine → R1b editor-UX** — the W4 model-then-editor rhythm; R1a greens on the gated api-server suite, R1b builds affordances on a working server under a browser walkthrough.
- **Next.** Deep recon of the server-side deep-clone mechanics (transaction / mapper / ownership / idempotency / cascade-delete / order-contiguity), then write the R1a `/feature` prompt per the planner-discipline checklists.

## 2026-06-15 — copy-granularity resolved + R1a `/feature` prompt written

- **Copy granularity (owner): "копирование значит копирование, мы копируем ВСЁ"** → folded into D-6 (#6) + `r1-clone-design.md` §1. A clone reproduces the full source subtree verbatim (week notes, day label+notes, all sessions↓); only the slot position (week `startDate` / day `dayOfWeek`) is preserved. Subtree clones reproduce inner `SchemaGroup`/`RowGroup` containers too (D-4-C "groups aren't cloned" = no standalone group-clone button only).
- **Deep recon (Explore agent) captured** the live patterns verbatim: `SCHEMA_BODY_INCLUDE` + week include tree · `retryOnP2034 + $transaction(Serializable)` · order `(max ?? 0)+10` + `resolveGroupedOrder` (2-phase contiguity shift) · auto-idempotency via `createAuthPostByParamHandler`→`wrapAuthHandler` · the `verify*Ownership` plan-walk · the full `onDelete: Cascade` FK chain (replace = `day.deleteMany` cascades) · the route composition.
- **Wrote `r1a-server-runner-prompt.md`** — self-contained `/feature` prompt: 6 endpoints (week/day `clone-from` replace; session/block/schema/row `duplicate` append), a shared deep-copy helper (fresh ids, catalog re-reference, group-container remap, order/contiguity), 4 phases (contracts → api-server → routes → gated tests), red lines (additive-only / no Prisma change / reuse patterns verbatim / catalog re-reference), acceptance (gated suite: deep round-trip + empty-source + idempotency + ownership + live cascade), adversarial pass.
- **Next.** Run `/feature` on the R1a prompt (this worktree or transported), then R1b editor-UX.

## 2026-06-15 — R1a clone server-engine BUILT (`/feature`, this worktree)

- **6 commits on `worktree-coach-station`:** `63c03778` scaffold · `548dedbe` contracts (clone-from + duplicate schemas) · `5f66b741` deep-clone engine + 6 api methods · `b8f5fa2d` 6 platform routes · `c5e537fc` review/QA fix · `1961abc6` gated tests.
- **Pipeline:** research (verified the spec's recon against live code) → design + plan (Gate A: 14 tasks, 4 phases) → implement (Phase 1 contracts ∥; Phase 2 engine then 5 methods ∥; Phase 3 routes) → Review **B** / QA **B**, 0 CRITICAL → 4 targeted fixes → gated tests (13 Must-Test, owner-run).
- **The engine** (`_shared/deep-clone.ts`): mutually-recursive copiers; fresh ids, catalog re-reference (never duplicates Exercise/Modifier/Label), group-container remap (total-or-throw via `requireMapped`), order re-sequence `(i+1)*10`, in-tx contiguity + remap witnesses. week/day `clone-from` = replace (cascade-delete + deep-copy, empty-source no-op, self-clone safe via pre-delete snapshot); session/block/schema/row `duplicate` = append (grouped joins same group via `resolveGroupedOrder`/new `resolveRowGroupedOrder`).
- **No-DB gates GREEN:** check-types 16/16, lint 16/16, dep:check clean (incl. `no-circular` — a `_shared`↔`schema/assertions` barrel cycle was broken by leaf imports). Additive — zero `schema.prisma` change.
- **Dispositions:** QA-001 (tx timeout + P2028 map), CLONE-001 (witness → structural remap guarantee), CLONE-005 (dedup), CLONE-006 (dead include) FIXED in `c5e537fc`. QA-005 + CLONE-002 deferred/documented (see `deferred.md`); the rest INFO-accepted.
- **PENDING:** the gated api-server suite (`db:reset && db:seed && pnpm --filter @repo/api-server test`) is the acceptance gate — owner ritual. Then PR, then R1b editor-UX.
