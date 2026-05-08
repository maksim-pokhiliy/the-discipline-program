# 0043. Plan editor save model — per-block atomic save, side-panel UX, MVP no-conflict-detection

- **Status:** Accepted
- **Date:** 2026-05-08
- **Tags:** `coaching`, `editor`, `ux`, `api`, `data-integrity`

## Context

PR #184 shipped the read-only week view at `/coach/plans/[planId]`. PRs #185 + #186 closed the domain shape (SETS_REPS = 9th archetype; `SchemeType` reduced to `{ id, name, archetypeKind }` with defaults computed via factory). The next iteration (i2a) adds the editor: coach creates / edits / deletes `PlanDay`, `PlanSession`, `PlanBlock`, `PlanItem` from the same surface.

ADR-0035 (Edit Session model) was the previous answer to "when does a card commit to the server". It is **superseded by ADR-0037**: the original plan editor was deleted, with it the `useEditSession` reducer, `<SaveIndicator>`, bulk-patch endpoint, full-entity PUTs, and `version` columns on the editable entities. The seven-trigger save matrix (explicit save + collapse/close + idle 8s + Cmd+S + route-change interceptor) and the optimistic-locking model were schema-deleted; only the conceptual lessons remain.

Two surrounding ADRs are load-bearing for the rebuild:

- **ADR-0036** — every mutation route runs through the `wrapHandler` / `wrapAuthHandler` factory layer; `Idempotency-Key` support is structural, default-on, derived server-side from the authenticated session. The client (`packages/api-client`) attaches `crypto.randomUUID()` per request. The rebuilt editor inherits this for free.
- **ADR-0042** — `SchemeType` is an abstract template; block creation populates `block.schemeParams` via `defaultSchemeParams(schemeType.archetypeKind)` factory at insertion time. The "where does the factory call live" question is one of the ADR-0043 decisions.

Six design decisions were surfaced in the i2a session opener; one (block create-time defaults flow) was added on review. They are answered below in a single decision matrix because each decision constrains the others (granularity ↔ conflict resolution ↔ indicator placement ↔ items-nesting model).

## Decision

The plan editor adopts a **per-block atomic save model** with **explicit Save**, **server-driven defaults at create**, **side-panel edit UX**, and **last-write-wins with no conflict detection in MVP**.

### 1. Save granularity — per-block

The smallest atomic save unit is the `PlanBlock` plus its child `PlanItem`s. Day, session, block each have their own dedicated Save action driven by their respective side panel. A block's Save commits the block-level fields (schemeParams, blockTypeIds, modifiers) **and** the full set of items as one transactional payload — server-side diff (delete missing, update matching, create new) inside one Prisma `$transaction`.

`block.weight` (the compliance-gradient field per ADR-0033) is intentionally NOT in the i2a body schema. ADR-0033's column + UI are scheduled for a separate PR; conflating them with the editor expands i2a's blast radius without dependency.

```
PUT /api/platform/training-plans/[planId]/days/[dayId]                — day fields
PUT /api/platform/training-plans/[planId]/sessions/[sessionId]        — session fields
PUT /api/platform/training-plans/[planId]/blocks/[blockId]            — block + nested items (full replace of items list)
```

`PlanItem`s never get a separate Save. Coach editing items in a block side panel sees one Save button at the block level; pressing it commits the block-and-items batch atomically. The per-item endpoints (`/items/[itemId]`) shipped in PR #181 stay intact for non-editor consumers (scripts, future API integrations) but the editor itself does not call them.

### 2. Block create-time defaults flow — backend-computed

`POST /plan-blocks` body carries `{ planSessionId, schemeTypeId, blockTypeIds[], order, modifiers?, items? }`. The handler resolves the `SchemeType.archetypeKind`, maps it through `SCHEME_ARCHETYPE_KIND_MAP[]` (`packages/api-server/src/mappers/lms/enum-maps-status.ts`) to the contract enum, calls `defaultSchemeParams(archetypeKind)` from `packages/contracts/src/entities/lms/_domain/scheme-archetype.constants.ts`, and writes `block.schemeParams` JSON itself. Client never references the factory at create time.

`items?` is optional. When present, the handler runs `prisma.$transaction` with `planBlock.create` followed by `planItem.createMany({ data: items.map(item => ({ ...item, blockId })) })` so that the create-with-items flow is one atomic network round-trip. This avoids the "POST skeleton → PUT items" two-phase race where the second call could leave an empty block stranded in the DB if it fails. Empty / undefined `items` skips the second step; the block is created without children (the editor's panel-skeleton mode for a brand-new block).

The factory remains the single source of truth for kind-level defaults; if a default ever changes (e.g., SETS_REPS default from 3 sets to 5), no client redeploy is needed. Coach-built tooling outside the platform app (future API consumers) does not have to know the contract — they POST a minimal create body and the server fills the params.

`PUT /plan-blocks/[id]` accepts the full `block.schemeParams` payload because edit is explicitly the coach's authority. Only create-time bootstrapping is server-driven.

### 3. Conflict resolution — last-write-wins, no detection in MVP

Two coaches saving the same block from two tabs is **not detected**. Last save wins silently. No `If-Match: <updatedAt>` header, no `version` column on `PlanBlock`, no 409 conflict response, no reload-or-overwrite dialog.

This is a deliberate scope cut. The product is single-team / single-coach today (memory: `feedback_coach_always_edit_mode`); ADR-0032 already centralises permission on HEAD_COACH. The two-tab scenario is the only realistic conflict path and is rare in single-coach use. Adding optimistic locking (column + If-Match + 409 handler + dialog state machine) is at least 200 LOC of editor + endpoint surface for a problem that does not exist in production today.

When the team scales (second coach, shared plan editing) the model is upgradeable: add `version Int @default(1)` to `PlanBlock`, gate PUT on `expectedVersion`, surface a conflict toast. The migration is additive and reversible. Documented as a follow-up.

### 4. Block edit UX — side panel

The block edit form lives in a **right-side drawer panel** that slides in from the page edge. The plan tree (week view) stays visible on the left; coach sees the block in context while editing. Standard MUI `<Drawer anchor="right">` pattern.

Day edits and session edits use the same side-panel pattern (consistency). Items are managed **inline inside the block side panel** — there is no separate item-level side panel. The block's panel renders an item list with add / remove / edit-prescription affordances; the item state is part of the block's draft and commits with the block's Save.

Modal dialog and inline accordion were the alternatives. Modal loses tree context (coach cannot reference the surrounding week while editing). Inline accordion bloats the tree visually when multiple blocks are open and complicates keyboard navigation.

### 5. Block creation flow — direct form

Block creation opens the same side panel as block editing, with empty / default values: empty BlockType chip set, no SchemeType selected, no items, weight `1`, modifiers `null`. Coach picks BlockType chips, picks SchemeType from a dropdown — the panel auto-populates the default `schemeParams` shape based on the chosen `archetypeKind` (rendered through the dispatcher subtree from `apps/admin/src/modules/scheme-types/components/scheme-params/`, lifted to `@repo/ui` per ADR-0042 follow-up). Coach adds items, fills prescription, presses Save.

No multi-step wizard. Wizard adds friction for power users (the target persona) and forces a separate UI for "create" vs "edit" when the same fields and validation apply to both. The dispatcher handles the per-archetype field rendering already; reusing it for create is free.

### 6. Save trigger — explicit Save button only (locked per ADR-0035 carryover)

The side panel's primary CTA is a Save button in the panel footer. There is no autosave, no idle-timer flush, no Cmd+S shortcut, no route-change interceptor in MVP. The five-trigger ADR-0035 matrix collapses to one trigger.

Side-panel close with a dirty draft prompts a confirm modal: "Discard unsaved changes? — Discard / Cancel". No auto-save on close. Coach is in control of when the server hears about changes.

`beforeunload` browser-level guard is added to prevent accidental tab close with unsaved drafts (cheap, native, no React state coordination).

### 7. Save indicator placement — page header

A 5-state indicator chip lives in the page header toolbar (not in the panel header, not as a floating action button). State scope is **per-plan** — the indicator reflects whether any open side panel has a dirty / saving / saved / error draft. With the per-block save model, only one panel is open at a time (opening a second one prompts the discard-confirm if the first is dirty), so per-plan and per-panel scope are equivalent in practice.

The five states (collapsed from ADR-0035's seven):

- `clean` — no dirty draft anywhere.
- `dirty` — at least one open panel has unsaved changes.
- `saving` — mutation in flight.
- `saved` — mutation succeeded; chip auto-fades to `clean` after 3 s.
- `error` — mutation failed (network, 5xx, validation); chip exposes a `Retry` action that re-runs the last mutation with the same payload.

`conflict` and `offline` states from ADR-0035 are dropped: `conflict` is structurally impossible per Decision 3; `offline` requires service-worker / queue infrastructure that does not exist and is not on the roadmap.

The chip is implemented as a `<SaveIndicator status>` component in `packages/ui/`. Per `feedback_pattern_compliance` it uses MUI `<Chip>` with a leading icon and a contextual color (success / warning / error) from theme palette tokens.

### 8. Empty-day affordance — hover-reveal `+` button (confirm per ADR-0038 §Round 6)

Hover on an empty day cell reveals a `+` IconButton that opens the day side panel with empty defaults. ADR-0038 already locked this; restated here for completeness so the editor implementation references one decision document.

The same hover-reveal pattern extends to:

- Empty session row inside a populated day → `+` reveals to add a block.
- Empty block (no items) inside a populated session → `+` reveals to add an item.
- All cascade affordances are hover-only on desktop; on touch devices the cells are always tappable and the `+` is always rendered (`@media (hover: hover)` guard).

### Schema diff

**No DB schema changes.** Per Decision 3, no `version` column is added. PlanDay / PlanSession / PlanBlock / PlanItem stay shaped as in PR #181's foundation.

**Contract additions** (`packages/contracts/src/entities/lms/plan-block/`):

- `createPlanBlockData` schema is **trimmed**: drop the optional `schemeParams` field if it currently exists at the contract layer. The body schema becomes `{ planSessionId, schemeTypeId, blockTypeIds[], order, modifiers? }`. (Verify in `apps/platform/src/lib/api/endpoints/plan-blocks.ts`; if `schemeParams` was already optional and unset, no client change needed.)
- `updatePlanBlockData` schema gains a nested `items` field: `items: PlanItemForUpsert[]` where `PlanItemForUpsert = { id?: string, exerciseId: string, prescription: PrescriptionInput, order: number }`. Items without `id` are created; items with `id` are updated; items present in DB but absent from the array are **hard-deleted** via `prisma.planItem.deleteMany`. PlanItem is intentionally not in `SOFT_DELETE_MODELS` (`packages/api-server/src/db/client.ts`): the editor-tier (Plan/PlanDay/PlanSession/PlanBlock/PlanItem) is the blueprint per ADR-0038 plan-as-rail; the history-of-record is the snapshot tier (`BlockSession.items` per ADR-0040), which is captured at session start and never references PlanItem rows after. Hard delete on the blueprint is therefore safe and matches the bounded-context separation.

**Endpoint changes** (`packages/api-server/src/endpoints/lms/plan-content/plan-block/admin.ts`):

- `createPlanBlock`: after parsing the create body, resolve `SchemeType` row, call `defaultSchemeParams(SCHEME_ARCHETYPE_KIND_MAP[schemeType.archetypeKind])` (the Prisma→Contracts bridge map at `packages/api-server/src/mappers/lms/enum-maps-status.ts`), write to `data.schemeParams`. `Idempotency-Key` is already inherited from the factory wrapper.
- `updatePlanBlock`: extend the handler to accept `items` and run the diff inside `prisma.$transaction`. Order: `delete`-missing → `update`-matching (with prescription replace) → `create`-new. The block's own field updates happen in the same transaction. No partial application — failure rolls back the whole batch. `verifyPlanEditable` is called before the transaction.

**Frontend additions:**

- `apps/platform/src/lib/hooks/use-plan-blocks.ts` — currently `useQuery` only; add mutation companions via `createCrudHooks` factory (matching `use-training-plans.ts:18` pattern). Mutations: `useCreatePlanBlock`, `useUpdatePlanBlock`, `useDeletePlanBlock`. Hand-rolled `useMutation` calls are explicitly anti-pattern per `feedback_pattern_compliance`.
- `apps/platform/src/lib/hooks/use-plan-days.ts`, `use-plan-sessions.ts`, `use-plan-items.ts` — same shape, mutation companions added. (Per Decision 1, items are not directly mutated by the editor, but the hook factory exists for parity and for future direct API consumers.)
- `apps/platform/src/modules/plan-detail/components/edit-panel/` (new) — side-panel components. Three variants: `<DayEditPanel>`, `<SessionEditPanel>`, `<BlockEditPanel>`. Block panel embeds `<BlockItemList>` for nested item editing. Each panel consumes the corresponding mutation hook.
- `apps/platform/src/modules/plan-detail/components/save-indicator.tsx` (or lifted to `@repo/ui` if the same pattern recurs in admin) — 5-state chip.
- `apps/platform/src/modules/plan-detail/lib/use-edit-panel-state.ts` — local React state hook owning the open-panel registry, dirty-draft tracking, and the discard-confirm coordination on panel close. Not a state machine; a `useReducer` is overkill for 5 states. Plain `useState` + a small set of callbacks.
- `apps/platform/src/modules/plan-detail/lib/use-before-unload.ts` — listens for `beforeunload` and calls `event.preventDefault()` if any panel is dirty. Native browser confirm.
- The dispatcher subtree at `apps/admin/src/modules/scheme-types/components/scheme-params/` is lifted to `packages/ui/src/components/scheme-params/` as part of the same PR (the editor needs it for block-level params editing). Admin re-imports from `@repo/ui` after the lift; behavior unchanged on the admin side. (Originally this lift was scheduled as a separate i2c PR; bundling it with i2a is more efficient because the editor cannot ship without it.)

### Migration plan

The discipline-program database is non-production (memory: `feedback_discipline_db_non_prod`); ADR-0019 is the canonical schema-edit path. There is no schema migration in this ADR (Decision 3 — no `version` column).

1. Edit contracts (`createPlanBlockData` trim, `updatePlanBlockData` items-array extension).
2. Edit endpoints (`createPlanBlock` defaults injection, `updatePlanBlock` items-diff transaction).
3. Lift dispatcher to `@repo/ui`. Update admin import path. Verify admin still builds.
4. Add platform mutation hooks via `createCrudHooks`.
5. Add side-panel components, save indicator, panel-state hook.
6. `pnpm check-types && pnpm lint && pnpm test` verifies.
7. Manual smoke at `/coach/plans/[planId]`: create day → create session → create block (verify backend defaults populated) → add items → Save → reload → state persists.

### Reversibility

**Two-way door.** The editor is a frontend feature plus an `updatePlanBlock` items-array extension. Removing items-batch and reverting to per-item PUTs is a contract + handler revert at the same cost as adding it.

The conflict-detection scope cut (Decision 3) is **additive forward** — adding `version` column + If-Match + 409 dialog later is an additive change with no breaking client impact during the rollout (clients without `If-Match` get default precondition success; the column is server-managed). This intentionally keeps the door open for the multi-coach future.

The dispatcher lift to `@repo/ui` (Decision 4 implementation) is a one-way move — admin re-imports from a different path. Reverting would require re-duplicating the dispatcher; the cost is minor (8 components + scheme-params-field), reversibility is ~30 min if needed.

## Consequences

**Positive:**

- One Save button per side panel matches the coach's mental model: "I edit until I'm done, then I save." No surprise commits, no cross-card timer races, no "did my idle timer just save garbage" anxiety.
- Backend-computed `block.schemeParams` defaults preserve the single source of truth from `defaultSchemeParams(archetypeKind)`. Future factory updates (e.g., SETS_REPS default sets count) ship without client redeploy.
- Items nested under block save match the side-panel UX 1:1 — coach sees one form, presses one Save, gets one atomic commit. No half-saved state where the block updated but two of five items did not.
- Five-state indicator is honest about supported behavior. Encoding `conflict` and `offline` would have meant either (a) un-triggered dead UI branches that bit-rot, or (b) implementing detection that nothing else in the system supports.
- LWW-without-detection is a concrete scope cut that ships the editor weeks earlier than detect-and-resolve would. The model is upgradeable; the upgrade path is documented; no architecture decision regrets future work.
- Side panel preserves tree context, avoids modal-stacking complexity, scales naturally to the four levels (day/session/block panels reuse the drawer chrome).
- Mutation hooks via `createCrudHooks` factory inherit invalidation, optimistic UI, error toasts, and idempotency-key handling for free. No new surface area to maintain per entity.

**Negative:**

- A coach editing one block, accidentally clicking another, prompting the discard-confirm, and choosing "Cancel" → flow interruption. The discard-confirm is the safety net for the explicit-save model; the interruption is the cost.
- The two-tab edit scenario produces silent overwrite. A hostile-test reviewer will surface this as a finding; the answer is "deliberate scope cut, single-coach assumption documented in ADR-0043 §Decision 3, upgrade path is additive". This is a known sharp edge.
- Items batched under block save means items with their own validation errors block the entire block save. Coach sees error toast → must fix every item before any item commits. (Per-item save would let validated items commit independently. Trade against atomicity: with per-item, a partially-saved block can violate cross-item invariants like "exactly one warm-up per session" if such surface — none today, but the surface is open.)
- The dispatcher lift is bundled with the editor PR, which expands i2a's blast radius. Mitigated by the lift being a path-rename refactor (no shape change).
- 5-state indicator is fewer states than ADR-0035 promised. Reviewers familiar with the rolled-back editor may question the cut. The answer is in §Decision 7.

**Neutral:**

- Cmd+S shortcut absence is unusual for a "professional tool". Power users may ask for it; it can be added later as a `keydown` listener on the side panel root that triggers the Save handler. Additive, no architectural change.
- The `beforeunload` guard fires on every navigation, even ones from in-app `<Link>` clicks. Modern browsers show a generic "Changes you made may not be saved" — this is acceptable; surfacing a custom modal would require intercepting `next/router` events and is more complex than it deserves at MVP scale.
- The dispatcher subtree post-lift will live at `packages/ui/src/components/scheme-params/`. Admin app re-imports from `@repo/ui`; no behavioral change. The originally-planned i2c PR (just the lift) is absorbed into i2a.
- `Idempotency-Key` continues to be inherited automatically per ADR-0036. The editor never explicitly threads the header.

## Alternatives considered

### Save granularity

- **Per-plan (whole tree atomic).** PUT /plans/[id] saves everything. Simple conflict (any edit blocks the plan), single network round-trip per coach session. Rejected because (1) the payload is enormous on a 12-week plan with 38+ blocks (~hundreds of KB JSON; not just bandwidth, but server-side parse + Prisma transaction cost), (2) any field-level error blocks every other change (bad UX), (3) it conflates "I saved my work" with "the entire plan is in a known consistent state" — the per-block model lets the coach commit incremental progress.
- **Per-session (middle ground).** PUT /plan-sessions/[id] commits the session and its blocks. Rejected because editing two blocks within the same session would force serialization (block A's Save in flight when coach starts editing block B → block B's draft is on stale base state). Per-block has independent mutation queues per block, no false-conflict surface.
- **Per-item (smallest atomic unit).** Each item Save commits independently. Rejected for the side-panel UX — coach sees a block-level form with item rows; one item failing validation while two others pass leaves the block in a confusing partially-saved state. Block-level atomic batch matches the form.

### Block create-time defaults flow

- **Client-side factory call.** Form layer calls `defaultSchemeParams(archetypeKind)`, sends complete `block.schemeParams` payload to backend. Rejected because it creates a dual-source-of-truth: if `defaultSchemeParams` ever changes (ADR-0042 explicitly admits this), every client needs redeploy. Backend-driven defaults centralize the change.
- **Hybrid (client opts in via undefined).** Client sends `schemeParams: undefined` for backend defaults, or full payload for override. Rejected because it adds branching in the API contract for a problem that does not exist — at create time, the coach has not customised anything yet, so backend-driven is unambiguous. Override at create-time is YAGNI; the coach edits via PUT after create if customization is needed.

### Conflict resolution

- **LWW + If-Match + 409 dialog.** First-saver loses, dialog with reload / force-overwrite choice. Rejected for v1 because (1) the team is single-coach today, the conflict surface is theoretical; (2) the implementation cost (column + endpoint + dialog state machine) is non-trivial; (3) the upgrade path is fully additive, so there is no architecture regret. Documented as the upgrade path when the team grows.
- **Server-side advisory lock with presence indicator.** "X is editing" surfacing, allow override. Rejected for v1 — needs a presence channel (websocket or polling), backend lock infrastructure, and rich UX. Out of scope; revisit when multi-coach is real.

### Block edit UX

- **Modal dialog.** Dedicated focus, clean entry-exit semantics. Rejected because the coach loses visual reference to the surrounding week / day / session while editing — a primary use case is "I see the previous block's volume and design this block to follow". Side panel keeps both visible.
- **Inline accordion expand.** Block row expands within the tree. Rejected because (1) multiple open accordions deform the week-view layout unpredictably; (2) accordion close behavior conflicts with the discard-confirm semantics (auto-collapse on outside-click vs preserve dirty draft).

### Block creation flow

- **Multi-step wizard.** BlockType picker → SchemeType picker → params + items. Rejected because power users (the persona) want one form they fill top-to-bottom; wizards optimise for novice users, who are not the audience. The dispatcher already handles per-archetype field rendering; reusing it removes the wizard's only justification.

### Save trigger

- **Idle autosave + collapse-flush + Cmd+S + route-change interceptor (full ADR-0035 matrix).** Rejected because each additional trigger is a state machine branch; with the explicit-save model the coach has one clear primitive ("the Save button"), and idle / collapse / shortcut are syntactic sugar that adds bug surface. The `beforeunload` guard keeps the safety net for accidental tab close without owning the in-app save semantics.
- **Field-level autosave (blur).** Already rejected by ADR-0035 § Alternatives for the same reasons; restated here for completeness — the multi-constraint discriminated `schemeParams` structure makes per-field PATCH structurally unsafe.

### Save indicator placement

- **Panel header.** Per-panel scope, indicator lives where the editing happens. Rejected because closing the panel hides the indicator; the page-header chip persists across panel open/close transitions and across panel-to-panel jumps, providing constant feedback.
- **Floating action button.** Bottom-right FAB pattern. Rejected because the page is desktop-first (ADR-0038, the coach surface) and FAB pattern is mobile-first; chip in the page header is the standard MUI desktop affordance.

## References

- ADR-0035 — superseded; concepts inform ADR-0043 (5-trigger matrix collapses to 1, 7-state indicator collapses to 5, version-column optimistic locking dropped).
- ADR-0036 — `Idempotency-Key` factory layer inherited automatically.
- ADR-0037 — what was deleted from the rolled-back editor; rebuild starts fresh under ADR-0043.
- ADR-0038 — four-level tree, plan-as-rail invariant, hover-reveal `+` empty-day affordance (Round 6).
- ADR-0039 — abstract template intent for `SchemeType`.
- ADR-0042 — `defaultSchemeParams(archetypeKind)` factory is the single source of truth for kind-level defaults; backend resolves it at block create.
- ADR-0009 — soft-delete via Prisma `$extends`. PlanItem is intentionally **not** in `SOFT_DELETE_MODELS`. Items omitted from `updatePlanBlock`'s items array are hard-deleted; the snapshot tier (`BlockSession.items` per ADR-0040) preserves history.
- ADR-0010 — BFF HTTP loopback for RSC; mutation hooks call `/api/platform/training-plans/...` routes that proxy to api-server.
- ADR-0033 — compliance gradient `block.weight` ∈ [0,1]; the editor's block panel exposes the field but the gradient UI itself is a follow-up (out of i2a scope).
- `apps/platform/src/lib/hooks/use-training-plans.ts` — canonical `createCrudHooks` factory pattern.
- `packages/api-server/src/endpoints/lms/plan-content/plan-block/admin.ts` — handler to extend per Decisions 1 + 2.
- `packages/contracts/src/entities/lms/_domain/scheme-archetype.constants.ts` — `defaultSchemeParams` factory.
- `apps/admin/src/modules/scheme-types/components/scheme-params/` — dispatcher subtree to lift to `packages/ui/src/components/scheme-params/`.
