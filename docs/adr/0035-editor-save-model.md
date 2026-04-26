# 0035. Editor save model — explicit edit sessions, no blur-autosave

- **Status:** Accepted
- **Date:** 2026-04-26
- **Tags:** `lms`, `editor`, `ux`, `data-integrity`

## Context

The deleted M0.2.A surface — `apps/platform/src/modules/plan-detail/components/week-workout-card.tsx` — saved workout edits on field blur. That worked when the only persisted shape was `Workout.content: String? @db.Text`, a single HTML blob whose only validation rule was a length cap. Blur fires, the blob is sent, the server stores it. There is no other state for an intermediate edit to be inconsistent with.

The structured workout domain (ADR-0027) replaced that blob with a seven-level tree (`TrainingPlan → Week → Day → LmsSession → Block → BlockSegment → SetGroup → ExerciseEntry`) and a four-level logging tree. Five interlocking constraints now govern any single-entity update:

1. `BlockSegment.schemeParams` is a discriminated JSON union validated by zod (ADR-0031). The discriminator (`schemeParams.kind`) must match `BlockSegment.archetypeKind` — enforced by the DB CHECK `chk_scheme_params_kind_matches`.
2. `ExerciseEntry.exerciseSnapshot` is server-authoritative immutable JSON captured against the live `ExerciseLibraryItem` row at write time (ADR-0030). The client may carry a copy but the server overwrites with the current library state.
3. `Prescription.refine` requires at least one of `reps / durationSec / distanceM / calories / composition`. A partial PATCH that lands `load + sideMode` without any of those fails the refine.
4. `BlockSegment.schemeParams` is parsed against `schemeParamsSchema` at three layers: write-zod, DB CHECK, read-zod. A partial update that ships `archetypeKind` alone leaves `schemeParams.kind` stale and the CHECK rejects the row at commit.
5. The plan tree is paginated (the editor fetches `?fromWeek=&toWeek=`) and the same entity may be open in two browser tabs of the same coach. A blur from tab A can land between blur1 and blur2 of tab B.

Against those five constraints, the blur-autosave pattern produces five recurring bug classes. They are documented in `docs/design/workout-redesign.md` §7.14 and reproduced here verbatim because the ADR is the canonical record:

1. **Partial edits → 400 from server.** Coach types `load=15kg, sideMode=EACH_ARM`, has not yet typed `reps`, clicks outside the input. Blur fires. PUT with invalid prescription. The server's `prescriptionSchema.refine` rejects it. The user sees a generic toast "Save failed" and does not understand which field is at fault.
2. **Race conditions.** Quick edits to several fields: blur1 fires → request1 in-flight → blur2 fires → request2 in-flight. Responses return out of order. Last-write-wins is not last-edit-wins.
3. **Cascading mutations break the DB CHECK.** Coach changes `archetypeKind` from `INTERVAL_LOOP` to `EMOM_LOOP`. The `schemeParams` field still carries `{kind: "INTERVAL_LOOP", ...}` until they re-edit it. Intermediate PUT violates `chk_scheme_params_kind_matches` and the DB rejects with a P2034 (or P2003 depending on path). The user sees an opaque error.
4. **DnD + blur interleaving.** A bulk-patch from a drag emits while a focused field is being blurred. Server applies the bulk-patch in its transaction; the blur PUT lands after, with optimistic local state that does not match the server's post-DnD view of the entity.
5. **Optimistic UI rollback impossible.** Server rejects blur1; client wants to roll back. But the user has already blurred field2 on top of the now-rolled-back state. There is no clean "undo blur1's optimistic write" once blur2 has merged on top.

The pattern that worked for one HTML blob does not work for a multi-constraint structured tree. We need a deliberate model for when, exactly, a card commits to the server.

## Decision

We adopt the **Edit Session model**. Every editable card in the LMS editor (`Block`, `BlockSegment`, `ExerciseEntry`, `SetGroup`) owns a local draft state managed by a `useReducer`-based hook. The card's draft never auto-commits on field-level blur. Persistence to the server happens only on one of five whitelisted save triggers, and only when the draft is valid against the corresponding contract zod schema.

The five whitelisted save triggers — and only these:

1. **Explicit Save button** in the card. The primary CTA when the user wants confidence the change has landed.
2. **Card collapse / close** — Esc key, the card's "X" button, or selecting another node in the canvas. If the draft is dirty + valid, the card flushes via `await mutation.mutateAsync` before unmounting. If the draft is dirty + invalid, the user sees a confirm modal ("Discard unsaved changes? — Discard / Cancel"); cancel keeps the card open.
3. **Idle autosave** — 8 seconds of no field changes. Fires only when the draft is valid. The 8-second timer is per-session; every dispatch resets it. The interval is configurable per card via `idleSaveMs` for tests but defaults to 8000.
4. **Cmd+S / Ctrl+S** — global keyboard shortcut. Flushes the focused session if valid; if invalid, surfaces an inline error and focuses the first invalid field. (No "Save all" semantics in M1; the focused-session-only contract keeps the keystroke predictable.)
5. **Route change interceptor** — before navigating away (`router.push` from any source, including `<Link>` clicks), the orchestrator calls `flushAll()` which awaits every dirty + valid session. If any session is dirty + invalid, a confirm modal blocks navigation ("You have unsaved changes — Discard / Cancel"). The browser-level `beforeunload` event handler additionally guards full-page navigation and tab close.

**Field-level `onBlur` is not a save trigger.** This is the invariant the model is named after. PR-review checklist enforces it for new code in `apps/platform/src/modules/plan-editor/`. (An ESLint rule banning `onBlur=mutation.mutate(...)` is considered for a follow-up if M1 review surfaces enough drift; for M1 the manual checklist is sufficient at the editor's current size.)

The HTTP contract for editable entities is **full-entity replace, not partial PATCH**. PUT `/blocks/:id`, PUT `/segments/:id`, PUT `/entries/:id` accept the entire entity payload (every editable field plus `expectedVersion`). The server replaces the row atomically. There is no transient state where one field has been updated and another has not. The CHECK constraint, the at-least-one refine, and the snapshot consistency invariants all hold against a single coherent payload.

For cross-entity operations (DnD reorders, bulk template applies, multi-card flushes that should land atomically), the editor uses **bulk-patch** — `POST /training-plans/:planId/patch` with an op-union body. Each op carries its target ID + `expectedVersion`. The endpoint runs the entire batch inside one Prisma `$transaction`. On the first version-mismatch the transaction rolls back and the response carries the structured `conflicts` list; the editor surfaces a "refresh — concurrent edit" banner. There is no accept-some-reject-some semantics: a batch either succeeds or fails atomically.

**Optimistic concurrency** uses a `version: Int @default(1)` column on `Block`, `BlockSegment`, `ExerciseEntry`. Every update sends `expectedVersion`. Every successful update increments the column. The Prisma update predicate is `WHERE id = $id AND version = $expectedVersion`; zero rows updated means a concurrent edit and the endpoint returns `409 ConflictError { currentVersion }`. The client handles the 409 by transitioning the card's status to `conflict` and prompting the user to reload from server (re-fetch + manual re-apply of intended edits).

**Per-entity mutation queue** uses TanStack Query v5's `setMutationDefaults` with `scope: { id: \`${entity}-${entityId}\` }`. This serialises mutations within the same scope ID, so two in-flight saves for the same `BlockSegment`queue rather than race. The wrapper hook lives at`packages/query/src/hooks/use-scoped-mutation.ts`and is consumed by`useEditSession`.

The card's status is one of seven values, surfaced via `<SaveIndicator status={status}/>`:

- `idle` — no dirty draft. Indicator shows "Saved Xs ago" (relative timestamp).
- `dirty` — draft has changes, draft is valid. Indicator: "Unsaved changes — saving in 8s".
- `dirty-invalid` — draft has changes, draft fails zod. Indicator: "Cannot save — fix errors". Save button disabled.
- `saving` — mutation is in flight. Indicator: spinner + "Saving…".
- `saved` — mutation just succeeded. Indicator: checkmark + "Saved just now". Auto-fades to `idle` after 5s.
- `error` — mutation failed (network error, 500, etc.). Indicator: "Save failed — Retry" button. Retries reuse the same draft state.
- `conflict` — server returned 409 (or bulk-patch returned `conflicts`). Indicator: "Edited in another window — Reload from server" button.

The state machine is implemented as a `useReducer` switch, one branch per save trigger and per server response. The reducer lives at `packages/ui/src/edit-session/use-edit-session.reducer.ts`; the consuming hook at `packages/ui/src/edit-session/use-edit-session.ts`.

The `<EditSessionProvider>` mounts at the editor root and exposes the orchestrator: cross-card `flushAll()` for tests and future "Save All" affordance, `requestRouteChangeFlush()` for route-change confirm modal, the Cmd+S keyboard listener, and the registration channel that backs the `beforeunload` handler. Sessions self-register on mount and self-unregister on unmount. The provider is not required for an isolated card to work (the hook degrades to per-instance behaviour); it is required only for the cross-cutting affordances (Cmd+S, beforeunload, route change). The `<EditSessionAwareLink>` component wraps `next/link` and intercepts in-app navigations; modifier-clicks (Cmd / Ctrl / Shift / Middle) bypass the guard.

**Scope of this ADR.** The decision applies to editable structural entities — `Block`, `BlockSegment`, `ExerciseEntry`, `SetGroup`. It does not apply to plan-level metadata (`TrainingPlan.name`, `TrainingPlan.description`, `TrainingPlan.status`), which continue to use the existing blur-autosave pattern in `apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx`. Plan metadata is a different shape (single string fields with no cross-field constraints, no DB CHECK, no `version` column) and the cost / benefit there falls on the other side. The carve-out is documented in this ADR explicitly so future contributors do not "fix" the plan-detail view by retrofitting the edit-session model where it does not belong.

## Consequences

**Positive:**

- Zero invalid PUTs leave the client. The client-side zod gate runs on every dispatch; only valid drafts ever fire `mutationFn`. The server's parse is then the second layer of defence, not the only one.
- Atomic state transitions. Full-entity PUT collapses the "partial update window" where a row is briefly inconsistent with the CHECK constraint or the at-least-one refine.
- Concurrent edits surface as explicit conflict UX. Two coaches editing the same segment, or one coach with two tabs open, see the conflict banner and a deliberate reload — never silent overwrite.
- Race conditions inside one card are killed by the per-entity mutation scope. Even if the user smashes Cmd+S three times in a row, only one save is in flight at a time and the queue keeps order.
- The save-indicator UX gives the user prompt feedback at every state. There is no surprise — the indicator either says "saved", says "saving", or says exactly what is wrong.
- The model is testable in isolation: the reducer is pure; the orchestrator's flush is a single async function; the conflict path is a single branch. Storybook stories cover the indicator's seven visual states; E2E tests cover five acceptance criteria — the four from §7.14 (no-PUT-on-blur; idle-autosave-when-valid; idle-no-save-when-invalid; concurrent-tab 409) plus a multi-card focused-Cmd+S + route-change confirm-modal scenario (three open cards all dirty, focused card flushes via Cmd+S yielding exactly one PUT, in-app navigation opens a confirm modal listing the two remaining drafts with Save All / Discard All / Cancel actions).

**Negative:**

- More code per editable card than naive blur-autosave. The reducer + the indicator + the validation gate add ~100 LOC per card type. We pay this once via shared primitives in `packages/ui/src/edit-session/` so consumer cards stay small (`<BlockBuilder>`, the six `<SchemeForm*>`, `<BlockSegmentEditor>`, `<ExerciseEntryRow>` each consume the hook in a single line).
- A category of bug becomes possible that did not exist with blur-autosave: the user types a change and never triggers a save (no Save click, no card collapse, no Cmd+S, no 8s idle, no route change — they just close the laptop). The 8s idle timer is the safety net; the indicator's prominent "Unsaved changes" copy is the second line of defence; the `beforeunload` handler is the third.
- The contract change (full-entity PUT) is one-way at the API level. Clients now must send every field, not a partial payload. Mitigated by the fact that no production client exists yet — the only consumer is the M1 editor, which is born under this contract.
- `useReducer`-based state means the React DevTools "click and edit a state field" workflow is unavailable — debugging requires reading the dispatched action shape. We accept this; the reducer is small enough to read end to end.

**Neutral:**

- The model does not preclude a future "save on every keystroke" mode for special UX (e.g., a notes textarea where the cost of a server round-trip per character is low). The `useEditSession` config exposes `idleSaveMs` so a notes-only card could set it to 1000; the no-blur invariant still holds (blur does not save; idle does, more frequently).
- Plan-level metadata explicitly opts out (see scope above). The carve-out is intentional; do not generalise.
- The `version` column is read-modify-write per row. There is no need for an index on `version` itself; the predicate is satisfied by the primary-key index. No DB performance concern.
- The mutation queue is local to TanStack Query; it does not coordinate across multiple browser tabs. Cross-tab serialisation is the 409 conflict path's job, not the queue's.

This ADR establishes a code-pattern contract that PR review enforces. The checklist:

- New components inside `apps/platform/src/modules/plan-editor/` that render an editable field must consume `useEditSession` (or a parent that does). They must not call `mutation.mutate` directly from `onChange` or `onBlur`.
- New PUT endpoints for editable LMS entities must accept full-entity payloads + `expectedVersion`. They must not accept partial PATCH bodies.
- New cross-entity batch operations must go through bulk-patch — they must not call per-entity update endpoints in a loop on the client.
- New `Block / BlockSegment / ExerciseEntry`-shaped entities must have a `version Int @default(1)` column from day one.

## Alternatives considered

**Blur-autosave (status quo M0).** Discussed in Context. Rejected for the five bug classes listed there. Workable for a single HTML blob; not workable for a multi-constraint structured domain.

**Explicit save only (no idle autosave, no collapse flush).** Coach must always click Save. Rejected: the most common user error in any text-heavy editor is forgetting to save before navigating away; the idle + collapse triggers exist precisely to backstop that. The 8-second window also lets the indicator give a "saving in 8s" countdown that doubles as a status cue.

**Field-level autosave with server-side reconciliation.** Each field's blur sends a single-field PATCH; the server merges with current state, validates the merged result, and returns either the new entity or a conflict. Rejected: complicated for discriminated `schemeParams` (the server cannot validate `archetypeKind` change without `schemeParams.kind` change, and a "merge intermediate" is exactly the bug the full-entity PUT exists to prevent); also doubles the server-side complexity (a single update endpoint becomes a per-field merge endpoint times every editable field).

**XState-based state machine for the per-card status.** Visualisable, mature ecosystem, first-class state machine semantics. Rejected: introduces a dependency at every editor card; the seven-state machine is not complex enough to justify the runtime; `useReducer` is the project's convention. Re-evaluable in M3 if timer FSMs in `@repo/workout-engine` (also state machines) end up wanting XState.

**A separate "draft" model in the database.** Persist drafts server-side (e.g., a `BlockDraft` row mirroring `Block`); Save promotes draft to canonical. Rejected: inflates schema with mirror tables; complicates concurrency (drafts also race); adds a server round trip per dispatch. Local draft state is the pragmatic answer.

**Optimistic locking via `updatedAt` instead of `version`.** Read `updatedAt` on fetch, send it back as `expectedUpdatedAt`. Rejected: timestamp granularity (milliseconds) is fine for human-pace editing but introduces awkward edge cases when a clock skews or two updates land in the same millisecond. An integer `version` is unambiguous; the column cost is negligible (4 bytes per row).

**`useScopedMutation` via local React state instead of TanStack `setMutationDefaults`.** Roll our own queue inside the hook. Rejected: TanStack's `scope` already implements exactly this pattern with an in-flight + queue contract; reimplementing forfeits TanStack's debugging surfaces and integration with the rest of the cache invalidation machinery.

## References

- `docs/design/workout-redesign.md` §7.14 — the long-form rationale and the M1 acceptance criteria (E2E tests).
- `docs/design/workout-redesign.md` §10.4 — the bulk-patch endpoint contract this ADR depends on.
- `.feature-dev/1777203936/design.md` §5.4.1 — the EditSession primitive's component shape.
- ADR-0027 — the structural rewrite that introduces the multi-constraint domain this ADR exists to govern.
- ADR-0031 — the discriminated JSON / DB CHECK pattern that full-entity PUT exists to keep consistent.
- ADR-0030 — the snapshot strategy that the editor's exercise-entry payload must respect.
- ADR-0005 — contracts-first with zod. The client-side validation gate uses the same shared schemas as the server-side parse.
