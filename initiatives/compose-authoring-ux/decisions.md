# compose-authoring-ux — decisions

D-numbered ratified decisions. Step-level calls that don't merit a full ADR live here; cross-initiative architecture calls go to `docs/adr/`. **Promote here at every gate** — this file is the SSOT for "why."

**Status legend:** `RATIFIED` (decided + acted) · `OPEN` (awaiting user ratification — do not execute past it) · `SUPERSEDED` (replaced — kept for the trail).

**Legitimacy lens (inherited from `plan-editor-compose`):** FOUR-PROJECTION INVARIANCE — a primitive means the same across (1) coach SETS, (2) athlete EXECUTES, (3) RENDER, (4) ANALYTICS. This initiative is a UX layer over that ratified algebra; it does not re-open it. Memory: `[[compose-four-projection]]`.

## Index

| ID                    | Topic                                                                          | Status   |
| --------------------- | ------------------------------------------------------------------------------ | -------- |
| D-SCOPE               | Only ladders are parallelizable (for now)                                      | RATIFIED |
| D-TRACK-IS-LADDER     | A track = a round-counter container ladder (Fran); parallel = N of them        | RATIFIED |
| D-TRACKS-DERIVED      | `tracks` derived from children; `interleaveOrder` moves onto the schema        | RATIFIED |
| D-CONTAINER-PER-TRACK | The flow authors container-ladder tracks, not `INNER_LADDER_MARKER`            | RATIFIED |
| D-FLAT-SINGLE         | One ladder stored flat; the 2nd track materializes the parallel parent         | RATIFIED |
| D-UI-STEPPER-STACK    | UI = "+ another ladder" below the stepper; drop the overloaded author fields   | RATIFIED |
| D-INERT-FREEDOM       | Composition is inert → model free to reshape; only the label is computed       | RATIFIED |
| D-SPLIT               | 2 steps, UI-first (UI → backend); rounds/tail/patterns backlog                 | RATIFIED |
| DR-1                  | Step 1 = hybrid B (pattern+stack in modal; movements on the card), not inline  | RATIFIED |
| DR-2                  | Step-1 persist = sequential real creates, NO stored `arrangement.tracks`       | RATIFIED |
| DR-3                  | Materialization: parent reuses the flat draft id; track 1 gets a fresh id      | RATIFIED |
| DR-4                  | Step 1 slims CREATE only; the EDIT modal keeps the full inspector              | RATIFIED |
| DR-5                  | Parallel concern isolated to the create flow; `RepetitionAxisField` unchanged  | RATIFIED |
| DR-6                  | "+ another ladder" = `PlusRowButton` pill below the stack vs inline "add step" | RATIFIED |

---

### D-SCOPE — only ladders are parallelizable, for now

- **Status:** RATIFIED (2026-06-09, owner).
- **Decision.** The "+ another track" affordance exists ONLY under the Ladder pattern. EMOM / interval / count / plain-list are not parallelizable in this initiative.
- **Rationale.** Owner: "я думаю только лесенки. начнем с этого." Keeps the first cut narrow and shippable; parallel-EMOM / parallel-interval are unverified as real coach needs. Widening → `deferred.md` BACKLOG-PATTERNS.

### D-TRACK-IS-LADDER — a track is a round-counter container ladder

- **Status:** RATIFIED (2026-06-09, owner + verify).
- **Decision.** A "ladder track" = a container carrying `repetition.ladder.steps` with its movement rows beneath it, sharing one counter (Fran 21-15-9 over its movements). "Parallel ladders" = N such tracks running simultaneously. The stepper sets the track's counter; the movements under it run on that counter.
- **Rationale.** Owner confirmed the Fran reading verbatim ("21 упр1 + 21 упр2, потом 15+15, 9+9 … вторая дорожка — отдельная лесенка со своим счётчиком"). Verify confirmed the current Ladder tile already produces exactly `composition.repetition = {kind:"ladder", steps}` at container level with movement rows. The model already thinks this way.
- **Links.** `D-LADDER` (plan-editor-compose) round-counter arm; verify "Trace Ladder authoring path" 2026-06-09.

### D-TRACKS-DERIVED — parallelism is derived, not stored

- **Status:** RATIFIED (2026-06-09, verify-grounded).
- **Decision.** Remove `arrangement.parallel.tracks` from the stored contract. Parallelism becomes a DERIVED fact: a schema is parallel iff it has >1 ladder track child; track order = `Schema.order`. `interleaveOrder` (`round_by_round`/`track_by_track`) moves to live on the schema/composition root (it is a real parameter, just not per-track).
- **Rationale.** Verify proved (a) `tracks` is ALWAYS a 1:1 mirror of the direct children — never built from anything else, so deriving loses no information; (b) `interleaveOrder` is consumed by NOTHING but a display label — moving it breaks no behavior. This is the real cure for the coach's pain ("вернуться к родителю и назначить треки"): the assignment step is deleted because the information already lives in the tree. Also kills the `superRefine` distinct-tracks guard and a class of dangling-ref bugs.
- **Links.** verify "Trace tracks/interleave consumers" 2026-06-09 (~10 consumer sites); `D-PERSIST`.

### D-CONTAINER-PER-TRACK — the flow authors container ladders, not markers

- **Status:** RATIFIED (2026-06-09).
- **Decision.** Adding a track produces a container sub-schema with its own `repetition.ladder` + movement rows. The flow does NOT produce `INNER_LADDER_MARKER` rows. The marker primitive stays in the contract untouched (sacred per `D-LADDER`); it is simply not what this flow emits.
- **Rationale.** The owner's track = multiple movements under a shared counter (round-counter), which is structurally the container ladder. `INNER_LADDER_MARKER` is `D-LADDER`'s OTHER case — a single-movement, per-track rep-scheme (Block C `21-15-9 ‖ 9-15-21`). Different case, different node level; not removed, just out of scope here. Reimposing one path for both would re-collide the analytics projection that `D-LADDER` deliberately split. (Adversarial check against `D-LADDER` before locking — `[[planner-adversarial-review]]`.)
- **Links.** `D-LADDER`; `deferred.md` MARKER-FATE.

### D-FLAT-SINGLE — one ladder flat; the 2nd track materializes the parent

- **Status:** RATIFIED (2026-06-09, owner "не усложняем" + engineering).
- **Decision.** A lone ladder is stored flat (`repetition.ladder` on the schema + movement rows, no parallel wrapper). Pressing "+ another ladder" materializes the parallel parent: the first ladder becomes track 1 under a new parent, the new ladder becomes track 2.
- **Rationale.** Avoids a vestigial parallel wrapper around every ordinary single ladder (against the "kill needless nesting" goal). Owner is indifferent to the under-the-hood restructure ("просто добавить кнопку … не усложняем") — it is invisible (a second column appears). The materialization's id-stability is an implementation detail → `deferred.md` MATERIALIZE.

### D-UI-STEPPER-STACK — the authoring affordance

- **Status:** RATIFIED (2026-06-09, owner + screenshot).
- **Decision.** Under the Ladder stepper's step row, add a "+ another ladder" button that appends a second stepper; tracks render stacked. Remove the standalone `header` / `arrangement` / `rest` / derived-label fields from the create flow — pattern tiles + their own settings only.
- **Rationale.** Owner, with the current-UI screenshot: "нам нужно просто добавить снизу кнопку которая будет добавлять ещё один такой же степпер. не усложняем." The overloaded modal is "the single biggest problem." Arrangement disappears as a field because it is now derived (`D-TRACKS-DERIVED`); header is computed from the stepper; rest surfaces contextually, not as a front-loaded axis.

### D-INERT-FREEDOM — inert composition frees the model

- **Status:** RATIFIED (2026-06-09, verify).
- **Decision.** Because composition has no executor today, the model can be reshaped freely for authoring without fear of breaking behavior. The only live consumer is `deriveCompositionLabel` (computed-on-read). The only follow-up: when BACKLOG-ROUNDS puts rounds+parallel on one node, teach the label to show both (today parallel wins).
- **Rationale.** Verify proved composition is INERT — no athlete-facing executor reads `repetition`/`arrangement`/`interleaveOrder`; the athlete view is "Coming soon"; no code handles repetition+arrangement together. ADR-0038/0039 confirm the inert status. So "does execution-semantics hold X" is not a live question. → `deferred.md` LABEL-COMBINE.

### D-SPLIT — two steps, rounds/tail/patterns are backlog

- **Status:** RATIFIED (2026-06-09, owner "бьем на 2 шага, не 3").
- **Decision.** **UI-first order: Step 1 = authoring UI flow (on mocks); Step 2 = contract+model+api reshape (persist under the approved UI).** Rounds-over-parallel authoring, the closing tail, and non-ladder parallelism are explicitly NOT steps — they live in `deferred.md` as backlog.
- **Rationale.** Owner cut my earlier 3-step proposal to 2 and narrowed scope to ladders. **Order:** I first wrote backend-first, then reversed to UI-first per project rule `[[ui-first-for-training-domain]]` (each step ships UI on mocks first, backend under the approved UX after) + coach-daily-UX priority; the owner delegated the order to me ("делай как считаешь правильным"). The `tracks`-derived contract honesty is invisible on screen — leading with it makes the coach wait without a visible result; the UI flow on mocks lets him approve the feel first, then the backend lands under it. The narrowed scope makes the 2-step split clean; the backlog items are real but unverified-as-needed and would dilute the first cut.

---

## Step 1 — implementation decisions (RATIFIED at Gate A, 2026-06-09; shipped PR `feat/compose-ladder-tracks-ui`)

Promoted from the step-1 RFC (`/feature` design stage) so the "why" is durable, not stranded in gitignored `.feature-dev/`. Approved by the owner at Gate A ("Approve — hybrid B").

### DR-1 — Step 1 is hybrid B (pattern + stepper-stack in the modal; movements on the post-save card), NOT inline-WYSIWYG

- **Decision.** The create surface authors the pattern + the ladder track-stack ("+ another ladder"); per-track movement rows continue through the EXISTING post-save per-track `AddRowButton` on each track's card. It does NOT author movement rows inline in the modal.
- **Rationale.** TODAY no pattern authors movement rows inline — for every pattern the coach saves the axis, then adds rows on the rendered card. Inline-WYSIWYG (option A) would be an authoring-MODEL rewrite for ALL patterns, far beyond the ratified D-UI-STEPPER-STACK ("just add a button … не усложняем"). The charter's round-trip-to-kill is the arrangement-ASSIGN round-trip — hybrid B kills exactly that; movements-on-the-card is the app's universal grain, not a parallel-specific wart.
- **Reversibility.** High — inline rows can be a scoped follow-up later without undoing B. **Revisit** only if the coach's walkthrough says the modal→card seam breaks "one flow."

### DR-2 — Step-1 persist = sequential real creates of parent + N container-ladder children; NO `arrangement.parallel.tracks` write

- **Decision.** A single ladder → one flat `createSchema` (unchanged). A parallel → a sequencer creates the parent + N container-ladder track children via the existing per-schema endpoint (`parentSchemaId`-threaded), STRUCTURALLY parallel only. The stored `arrangement.parallel.tracks` array is NOT written.
- **Rationale.** The gate needs REAL persisted track cards (hybrid B's `AddRowButton` lives on persisted cards) → pure-mock (P0) fails the gate. Writing `tracks` (the prompt's "preferred" P3) is Step-2 contamination — that array is the EXACT field `D-TRACKS-DERIVED` deletes in Step 2, and verify confirmed the board has NO parallel layout treatment anyway (`schema-card` renders sub-schemas as a vertical list regardless of arrangement; only `deriveCompositionLabel` reads `arrangement.parallel`). So P3 would buy ONLY a cosmetic parent label at the cost of a build-then-delete write + a fake hard-coded `interleaveOrder`. P2 = the structural tree Step 2 derives `tracks` from, minus the contaminating write.
- **Consequences.** Sequencer uses direct `api.schemas.create` (not the `useWeekMutation`-wrapped hook) → ONE invalidation + ONE toast instead of 3-per-submit. Mid-sequence create failure leaves a recoverable partial materialization (no rollback — atomic persist is Step 2; → `deferred.md` MATERIALIZE-ATOMICITY). Parent `composition` is `{}` → its derived label is flat until Step 2 (cosmetic; the two track cards render their ladders). **Four-projection is structurally preserved** — only the cosmetic label lags, which Step 2 closes.
- **Reversibility.** High — Step 2 swaps the sequencer for atomic/transactional materialization + derived-tracks read; P2's structural tree is already Step-2-shaped.

### DR-3 — Materialization id-stability: the parent reuses the flat single's draft id; track 1 gets a fresh child id

- **Decision.** On "+ another ladder", `materializeParallel` returns a parent that REUSES the flat single's `id`; the original ladder becomes track 1 with a FRESH child id; track 2 is a fresh ladder.
- **Rationale.** The modal's `onUpdateNode`/`onRename` key on the top-level `container.id`; keeping it stable across the 1st→2nd transition avoids an identity flip mid-session. Draft ids are throwaway UUIDs (server mints cuids on create), so PERSIST id-stability is moot in Step 1 — Step 2 separately owns server-cuid stability (a different question). → `deferred.md` MATERIALIZE.
- **Reversibility.** High — internal draft detail, no contract impact.

### DR-4 — Step 1 slims the CREATE flow only; the EDIT modal keeps the full inspector (arrangement included)

- **Decision.** CREATE renders the slim `CreateSchemaFlow` (tiles + ladder stack). EDIT is UNCHANGED (`DerivedLabelCard` + `ContainerInspector` with the arrangement field).
- **Rationale.** Existing stored parallels carry `arrangement.parallel.tracks` until Step 2; the EDIT modal must round-trip them (preserves REV-003 fold + QA-Must-5 byte-for-byte survival). Slimming edit now would drop that coverage before Step 2 removes the field.
- **Reversibility.** High — Step 2 unifies create+edit once `tracks` is derived.

### DR-5 — Parallel concern isolated to the create flow; `RepetitionAxisField` left unchanged (stays the edit-mode body)

- **Decision.** `CreateSchemaFlow` composes `AxisModeButtonGrid` (tiles) + `LadderTrackStack` for the ladder branch, and reuses `RepetitionAxisField` wholesale for non-ladder kinds. `RepetitionAxisField` is NOT prop-bloated with the track-stack.
- **Rationale.** D-SCOPE (only ladder is parallelizable) — a track-stack used in one mode/one pattern doesn't belong on the shared field. Exactly ONE `role="group" name="repetition"` holds in both branches (ladder renders the grid directly; non-ladder via `RepetitionAxisField`).
- **Reversibility.** High.

### DR-6 — "+ another ladder" = `PlusRowButton` pill below the stack; the stepper's "add step" stays inline tiny-text

- **Decision.** The append-track affordance is a structural `PlusRowButton` pill below the whole stack (accessible name "another ladder"); the per-step "add step" stays the inline tiny-text button. Distinct controls (open-question 3).
- **Reversibility.** Trivial.

### Step-1 build learning (not a decision — a trap to remember for Step 2 + similar UI state machines)

The materialized parallel parent carries NO `repetition` (DR-2), so deriving the active pattern as `draft.repetition?.kind ?? "once"` made "+ another ladder" silently collapse the editor to an empty "Once" (the draft was still structurally parallel → a hidden bad write on submit). Caught by adversarial QA driving the real modal (BOTH Review and QA reproduced it; static reading missed it). Fix: `activeKind = isParallelDraft(draft) ? "ladder" : (draft.repetition?.kind ?? "once")`. **Lesson:** when a node's "kind" is encoded STRUCTURALLY (parallelism = >1 child) rather than in a field, every reader must consult the structural predicate, not just the field. Step 2's derived-tracks read must honor the same rule.
