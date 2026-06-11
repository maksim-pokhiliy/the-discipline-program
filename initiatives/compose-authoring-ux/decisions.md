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
| DR-S2-1               | Derived-parallel predicate: ≥2 container children, no repetition/arrangement   | RATIFIED |
| DR-S2-2               | `interleaveOrder` re-homed to the composition root; absent ⇒ display default   | RATIFIED |
| DR-S2-3               | Atomic materialization: one `POST …/schemas/parallel`, one tx, one idem key    | RATIFIED |
| DR-S2-4               | Label home: shared widened function; tree builders + card pass structure       | RATIFIED |
| DR-S2-5               | Marker containers are NOT structurally parallel; Block C fixture restated      | RATIFIED |
| DR-S2-6               | Seed coverage gate: structural tallies replace Json-path tallies               | RATIFIED |
| DR-S2-7               | QA-106 closed: full-depth subtree guards; `buildSchemaWithBody` deleted        | RATIFIED |
| DR-S2-8               | Edit path: draft parallel arm deleted; parallel is edited structurally         | RATIFIED |
| DR-S2-9               | Stale stored-tracks blob = out of contract; fails loud; no fallback code       | RATIFIED |

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

---

## Step 2 — implementation decisions (RATIFIED at Gate A, 2026-06-10; branch `feat/compose-derived-parallel`)

Promoted from the step-2 RFC (`/feature` design stage) so the "why" is durable, not stranded in gitignored `.feature-dev/`. Approved by the owner at Gate A. The cross-initiative architecture call is **ADR-0040** (`docs/adr/0040-derive-parallelism-from-structure.md`); these entries are the step-level distillation.

### DR-S2-1 — Derived-parallel predicate = ≥2 container children AND no repetition AND no arrangement

- **Decision.** `isStructurallyParallel(composition, {containerChildCount})` := `containerChildCount >= 2 && repetition === undefined && arrangement === undefined`, living in contracts (`composition-label.ts`) as the single shared implementation. Rows (including `INNER_LADDER_MARKER`) do not count as children; an explicit `ordered`/`superset` suppresses the derivation.
- **Rationale.** This **WIDENS the D-TRACKS-DERIVED letter** ("ladder track child" → "container child", plus the no-repetition/no-arrangement qualifiers) — ratified by the owner at Gate A with **block-009 as the forcing instance** (alternating plain-container sets: genuinely parallel, not ladders; the literal reading would de-classify it). The no-repetition qualifier kills the EMOM false positive (block-080/180 cadence slot parents); container scope mirrors the shipped step-1 draft predicate per the build-learning one-predicate rule. Verified against every real multi-child parent. D-SCOPE constrains what the authoring flow EMITS, not what the read layer recognizes.
- **Consequences.** A repetition-less parent with ≥2 sub-schemas reads "parallel" even if a coach meant a plain grouping — escape hatch: explicit `arrangement: ordered`. BACKLOG-ROUNDS (rounds OVER parallel) will DEFEAT the no-repetition qualifier — the predicate needs an explicit signal then; that is LABEL-COMBINE's tracked scope.
- **Reversibility.** Two-way at the function level (one implementation point).
- **Amended (Gate B, 2026-06-10).** Two ratifications. (a) **`once` ≡ absence**: the predicate treats `repetition: {kind:"once"}` as no repetition (QA-301 one-way trap — the repetition control has no unset, its display default IS "once", so one exploratory toggle killed the parallel label with NO UI path back; `should-be-container.ts` precedent encodes the same equivalence). (b) **The escape hatch is real and authorable**: the edit-save fold (`build-axis-composition.ts`) now passes explicit `ordered` through instead of normalizing it to absent (REV-S2-W2 — fold-normalization flipped a stored-ordered multi-child parent to "parallel" on an untouched save and made the hatch un-authorable); stored-absent → absent, stored/selected ordered → `{kind:"ordered"}` byte-for-byte, the inspector's display-only ordered fallback still writes nothing.

### DR-S2-2 — `interleaveOrder` home = optional composition root field; absent ⇒ display default; stranded values inert

- **Decision.** `interleaveOrder?` at the composition root (inside the Json — D-PERSIST, no Prisma change); new `DEFAULT_INTERLEAVE_ORDER = "round_by_round"`. The create flow never writes it; seeds omit it (all four were the default — omission loses nothing); the edit-mode control writes it. NO tree invariant ties it to structure: a value stranded on a non-parallel node is ignored by derivation and round-trips untouched.
- **Rationale.** D-TRACKS-DERIVED ratified the move verbatim; the only consumer is the summary string (re-verified). A hard "only on parallel parents" invariant was rejected — deleting a track child runs no guard, so a stranded value would 400-poison later unrelated writes on the subtree.
- **Consequences.** The field is data-absent after reseed until a coach touches the edit toggle; the summary formatter default-fills for display.
- **Reversibility.** Two-way (optional field; removable by the same drain pattern as ADR-0038/39).

### DR-S2-3 — Atomic materialization = new `POST …/schemas/parallel` (unfreezes plan-editor-compose DR-3, scoped to parallel-ladder trees)

- **Decision.** One dedicated endpoint: request `{blockId, parentSchemaId?, header?, tracks:[{header?, steps}]≥2}`; the server assembles all compositions (only ladder tracks are materializable — D-SCOPE at the transport); one Serializable `$transaction` + `retryOnP2034`; write-guarded via the full-depth subtree; response = the subtree (`SchemaWithBody`, 201). The step-1 client sequencer becomes a single request; the hook surface and modal UX stay frozen.
- **Rationale.** Atomicity only exists server-side — a client cannot transact across N POSTs. The route factory's default idempotency (ADR-0036) covers the WHOLE tree under ONE key, so duplicate-parent-on-retry closes as a side effect. A dedicated tight schema beat extending `POST /schemas` with recursive children (guard surface widens, response forks) and the compensating-delete saga (not atomic).
- **Consequences.** New route/endpoint/client method to maintain; a future non-ladder parallel (BACKLOG-PATTERNS) extends the request schema rather than reusing a generic tree API. MATERIALIZE's server-cuid question resolves trivially: the server mints all cuids in one shot; the draft's throwaway UUIDs never reach the wire.
- **Reversibility.** Two-way (endpoint deletable; per-schema creates still exist).

### DR-S2-4 — Label derivation home: shared widened function; structural labels in tree builders; the card passes structure

- **Decision.** `deriveCompositionLabel(composition, structure?)` in contracts; `buildSchemaForest`/`buildSchemaSubtree` recompute each node's `label` with `containerChildCount = subSchemas.length` after assembly; `mapToSchema` (bare row, no children) keeps the flat derivation; the card passes `subSchemas.length`, the edit-modal preview passes the draft child count; the summary formatters gain the same optional structure parameter (parallel part from `interleaveOrder ?? DEFAULT_INTERLEAVE_ORDER`).
- **Rationale.** One function, three structure-bearing call-site families; degrades safely where structure is unknowable. Server-label-only was rejected (the edit modal must label unsaved drafts client-side anyway); synthesizing a fake stored arm into reads was rejected (the lie moves instead of dying).
- **Consequences.** Bare create/update/reorder responses label a parallel parent "flat" — bounded dishonesty: nothing renders from those responses (cards render from the structural week query). `composition === null` keeps `label: null` and no tag.
- **Reversibility.** Two-way.

### DR-S2-5 — Marker containers are NOT structurally parallel; Block C four-projection fixture restated

- **Decision.** Block C's fixture composition becomes `{}` (children stay the two `INNER_LADDER_MARKER` rows with mirrored steps); the four-projection proof file gains a structural-parallel case proving a two-sub-container parent labels `parallel` while the marker container does NOT (rows ≠ container children). The collision fixture (fused ladder+marker) stays rejected.
- **Rationale.** D-LADDER's sacred object is the marker ROW primitive, not the "parallel over markers" label; what disappears is only the stored arrangement that pointed track refs at ROW ids — a shape D-CONTAINER-PER-TRACK already declared un-authorable. Extending the predicate to count marker rows was rejected: it would invent read semantics for an unauthorable shape and re-collide the analytics projection D-LADDER deliberately split. Zero marker rows exist in seed or production paths (grep-verified).
- **Consequences.** A hypothetical multi-marker container renders label-less until MARKER-FATE gets an authoring flow and its own affordance (noted in `deferred.md`). The proof file now also pins the predicate's marker stance.
- **Reversibility.** Two-way (test-level restatement; the marker contract surface is untouched).

### DR-S2-6 — Seed coverage gate rework: structural tallies replace Json-path tallies

- **Decision.** `ARRANGEMENT_KINDS` shrinks to `["ordered","superset"]`; a new `structural.parallel` cell (floor 1) tallies parents with ≥2 sub-schemas and neither repetition nor arrangement (groupBy + JS predicate — Prisma Json "key absent" filters are unreliable); `entity.alternatingGroup` (floor 2) switches to the same structural tally; the gated coverage test mirrors both.
- **Rationale.** Post-reshape the stored Json-path count is 0 — without rework, `db:seed`'s gate and the gated test both fail. Structural tallies measure what the model now means; the reshaped seed tallies 4 structural parallels (block-009/037/087/010-middle) — both floors hold.
- **Consequences.** The predicate logic is restated in seed-tooling terms (Prisma rows, not contract objects) — drift risk accepted as test-covered.
- **Reversibility.** Two-way.

### DR-S2-7 — QA-106 closure: block-flat fetch + full-depth `buildSchemaSubtree`; `buildSchemaWithBody` DELETED

- **Decision.** All three production write-guard sites (`schema/assertions.ts`, `schema-row/admin.ts` create + update) fetch the block's schemas FLAT and project via the new `buildSchemaSubtree(flat, rootId)` (shares the forest recursion, unbounded depth). The depth-capped `buildSchemaWithBody` is deleted, not fixed in place — the capped shape cannot be re-adopted by a future caller. The `assertArrangementRefsInScope` parallel arm is deleted with it (a structural parallel cannot dangle by construction).
- **Rationale.** The projector recursion alone was insufficient — the FETCHES were depth-1. Write guards now see exactly what reads see (read-path congruence with the week read's flat-fetch + forest); block-010 (depth-3 rounds → parallel → ladder tracks) stops being amputated mid-guard. Cost bounded: one query per guard, schemas-per-block ≤ ~25.
- **Consequences.** Write guards validate the touched subtree at REAL depth — previously-invisible deep violations now 400 honestly. QA-106-RECUR CLOSED in `deferred.md`.
- **Reversibility.** Two-way mechanically; treat as one-way — re-capping re-opens QA-106.

### DR-S2-8 — Edit path: draft parallel arm deleted; interleave control re-homed; structural parallel is edited structurally

- **Decision.** Draft `ArrangementAxis` loses the parallel arm (`ParallelTrackDraft` deleted); `ComposeContainer` gains `interleaveOrder?`; `parallel-arrangement-fields.tsx` is deleted; `ArrangementAxisField` offers ordered|superset; a slim `InterleaveOrderField` renders in the inspector only when the previewed label kind is `parallel`. Making a schema parallel in edit-mode = adding a second sub-schema on the card — no modal toggle.
- **Rationale.** DR-4 explicitly deferred edit unification to step 2; the track-assign Switches ARE the round-trip D-TRACKS-DERIVED kills. Gating the interleave control by the derived label (not a local child count) honors the one-predicate rule. Rendering the full ladder track stack inside edit was rejected — new create-grammar surface the owner never walked through; the gate needs round-trip, not redesign.
- **Consequences.** QA-Must-5 restates: an untouched save of a structurally-parallel schema re-emits `{}` (or `{interleaveOrder}`) byte-for-byte and never touches children. REV-003's fold-toggles interaction is superseded by the structural path.
- **Reversibility.** High (UI-level).

### DR-S2-9 — Stale stored-tracks blob = out of contract; reads fail loud; no fallback code

- **Decision.** A post-reshape `arrangement.kind === "parallel"` blob fails `compositionSchema.parse` (strict schema, unknown arm) → 500 on the read path, 400 on any write that re-submits it. No tolerant-reader arm, no migration shim.
- **Rationale.** Aggressive-migration ground rules (no bridges; the reseeded DB has no legacy rows) — exactly the ADR-0038/0039 precedent for drained fields. The cheap remedy is `pnpm db:reset && pnpm db:seed`.
- **Consequences.** Raw-SQL/manual inserts of the old shape fail loudly instead of half-rendering — acceptable in a non-prod solo world.
- **Reversibility.** N/A (absence of code).

---

## Post-close supersede pointer (2026-06-10, append-only)

The initiative closed with both steps merged. The 2026-06-10 domain-model review founded `initiatives/session-primitive/`, whose ratified **D-BOX** (relations = explicit Group nodes with coach-owned opaque labels; no semantics derived from child count; no typed relation kinds) **will supersede** the structural-derivation mechanism here (D-TRACKS-DERIVED, DR-S2-1, DR-S2-4) when its implementation lands. The marker primitive's death (vs MARKER-FATE / D-LADDER's sacred clause) is PROPOSED there as D-MARKER-DEATH, OPEN. Until then ADR-0040 is the live behavior of main. Recorded forward per the house supersede-don't-edit mechanism; no entry above is edited.
