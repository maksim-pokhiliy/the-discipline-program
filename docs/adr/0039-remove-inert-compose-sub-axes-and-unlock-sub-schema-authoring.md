# 0039. Remove the inert compose sub-axis surface + unlock sub-schema authoring (continues 0038; partially supersedes 0037 §Deferred)

- **Status:** Accepted (continues the ADR-0038 inert-surface removal; partially supersedes ADR-0037 §Deferred — the _parallel-track interleave_ inert surface that ADR-0038 explicitly left out of scope)
- **Date:** 2026-06-09
- **Deciders:** Maksim (owner), Claude (co-owner)
- **Tags:** `lms`, `plan-content`, `domain-model`, `yagni`, `ui`

## Context

ADR-0038 cut the two largest inert stubs from the compose-only plan-content model (ADR-0037): the 5th `scoring` axis (Container axes 5 → 4) and the `Session.freezeLoadsAtCreation` column. It deliberately scoped **out** the rest of ADR-0037's deferred execution surface — naming the `arrangement.parallel.interleaveOrder` inert channel specifically — and left it for a future decision.

This is that decision, taken one PR later while the same blast radius is hot. Two motivations converged:

1. **More inert sub-axis surface than scoring.** Beyond the parallel-interleave channel, the Container axes had accumulated a second tier of stored-but-unread structure: alternate repetition _kinds_ and per-axis fields designed against a 2026-06 guess at the execution engine, plus a `programKind` classifier that never drove behaviour. Concretely:

   - `repetition.kind: "window"` — a wall-clock `{ startHhMm, endHhMm }` time-window repetition (with its own `superRefine` ordering rule + `hh:mm → minutes` parser). Authored in exactly one seed block; no engine read the window.
   - `repetition.kind: "range"` — a min/max rounds repetition, distinct from the already-present `count` repetition's `range` count VO. Redundant: a rounds range is expressible as `count` + a range count. (Note: the **flat** `RepNotation` value-object's own `kind:"range"` for reps min/max is a different type and stays.)
   - `repetition.cadence.totalMin` — a redundant total-minutes field on EMOM cadence; the cadence already carries `everyMin` × `rounds`, from which the total is derived.
   - `arrangement.parallel` per-track `setEnumeration` + `pairedWithRowId` — a per-track set-list and a paired-row pointer, the inert authoring scaffolding for an interleave engine that does not exist. After removal a parallel track is just `{ childSchemaId }`.
   - `composition.programKind` — a thin string classifier (`wave` / `cluster` / `drop_set` / …) on the container that no reader keyed on. It threaded a `stagedProgramKindSchema` enum, a draft field, an axis editor field + label map, a composition-summary push, and a `§17` coverage section.

   Each carried the same tax ADR-0038 named: every plan-editor refactor (the redesign initiative propagates to all three apps) paid the mapper-correctness and render-fork cost; every contract reshape dragged the extra union members; the gated ~10-minute seed-coverage suite carried `window` + `programKind` cells.

2. **`parallel` was authoring-unreachable.** The arrangement = `parallel` variant requires ≥2 nested sub-schemas to reference as tracks. Sub-schemas could only be **seeded via the API** — there was no UI affordance to create one, and the schema card actively **hid** the edit-axes (`Tune`) and `Delete` controls on any schema whose `parentSchemaId` was non-null. So the one composition that needs nesting was the one composition a coach could not build. The contract already supported it end to end (`createSchemaSchema.parentSchemaId`, the admin endpoint's `parentSchemaId` scope derivation) — only the platform UI was missing the door.

YAGNI for the inert sub-axes; reachability for parallel. Both move the model toward "only what the engine reads is stored, and everything storable is authorable."

## Decision

Two coordinated changes — a removal and a build — landed bridge-free on one branch (no users, non-prod Neon, solo dev).

**A. Remove the inert compose sub-axis surface (F1–F6).**

- **`repetition.kind: "window"`** is deleted from the discriminated union, with its ordering `superRefine`, the `hh:mm` parser/pattern, the `window-axis-field` editor, the label/summary cases, and its coverage cell. Repetition kinds go **8 → 6**: `once` · `count` · `ladder` · `timeCap` · `cadence` · `interval`.
- **`repetition.kind: "range"`** is deleted (the composition repetition range, **not** the flat `RepNotation` reps range).
- **`repetition.cadence.totalMin`** is dropped; the total stays derivable from `everyMin` × `rounds`.
- **`arrangement.parallel` track shape** is slimmed to `{ childSchemaId }` — `setEnumeration` and `pairedWithRowId` and their endpoint/seed/back-patch resolution + the in-scope paired-row assertion are removed. The parallel section is now **toggle + interleave only**.
- **`composition.programKind`** is deleted entirely (contract enum + type, draft field, `program-kind-axis-field`, label map, summary push, `should-be-container` has no programKind disjunct, the `§17` coverage section, and every seed producer).
- **F4 refusal scaffolding is deleted wholesale.** The inverse-mapper's typed "refusal" channel (`InverseRefusalReason` / `is-compose-editable` / the refusal modal state) existed solely because `range` was an unrepresentable-in-the-editor kind; with `range` gone the inverse mapper is total over the 6-kind union and the refusal shells are dead.

No `schema.prisma` change: `composition` is `Json?` (`schema.prisma:667`); every removed field lived inside that blob, never as a column. Stale stored keys (e.g. a persisted `window` kind) fail parse on read and are cleared by the owner's reseed.

**B. Unlock sub-schema authoring (F5).**

- The `AxisEditorModal` create mode accepts an optional `parentSchemaId` and forwards it to `useCreateSchema` **conditionally** (the key is absent for a top-level create, so the top-level payload is byte-identical). `parentSchemaId` is folded into the draft `modeKey` so two sibling add-sub modals on the same block hold independent drafts.
- A new `AddSubSchemaButton` (a verbatim mirror of `AddSchemaButton`, passing `parentSchemaId = parent schema id` and `blockId = parent's blockId`) mounts inside every schema card, below the sub-schema list, visible even at zero sub-schemas (mirroring how `BlockCardBody` places `AddSchemaButton` below the schema list).
- The `!isSubSchema` gates are reversed: the `Tune` (edit-axes) and `Delete` IconButtons in `SchemaCardHead`, and the edit `AxisEditorModal` + delete `ConfirmationModal` mounts in `SchemaCard`, now render for sub-schemas too. The `isSubSchema` prop is removed. Recursion propagates the edit / delete / add-sub affordances to every nesting depth for free.
- The edit-mode modal title stays **"Container composition"**.

**Net effect — parallel is reachable with no seed:** a coach clicks _Add sub-schema_ on a parent ≥2 times, opens the parent's _Edit axes_, sets arrangement = `parallel`, and toggles the children as tracks. `schema-to-draft-container` already maps `subSchemas` → child containers, `collectArrangementTargets` surfaces them, and `ParallelArrangementFields` toggles them — F5 only opened the door.

## Consequences

- **Continues ADR-0038, same mechanism.** ADR-0038 removed the scoring axis + freeze column and explicitly deferred the parallel-interleave surface; this ADR removes that surface (and the rest of the inert sub-axis tier) and adds the authoring affordance. The compose-only model, the emergent-archetype principle, the four surviving axes, and the sacred Week/Day/Session/Block/Schema tree stay **fully in force**.
- **Partial supersede of ADR-0037 §Deferred, narrow.** Only the inert sub-axis fields enumerated above are reversed. The `interleaveOrder` enum **value** survives (it is the live discriminator the parallel section now exposes); what is removed is the per-track `setEnumeration` / `pairedWithRowId` inert authoring scaffolding around it.
- **Contract tightens.** `.strict()` rejects any stored row carrying a removed key (`window` / composition-`range` / `totalMin` / `setEnumeration` / `pairedWithRowId` / `programKind`). Stale keys fail parse on read — cleared by the owner's reseed (non-prod, no real data).
- **Coverage shrinks**; `requiredCellIds` and the `§17` section drop in lockstep with the `coverage-cells` producers so the gated seed-coverage suite re-greens on a freshly reseeded DB. The seed re-authored its sole `window` block to a `timeCap{20,min}` and degraded its `wave` / `cluster` / `drop_set` blocks to `{}`.
- **Repetition union is now total at 6 kinds** across every consumer (`deriveKind`, the inverse mapper's `satisfies never`, the axis tile group → 6 tiles).
- **Parallel is authorable for the first time.** This unblocks the only composition that required API seeding, and it does so through the recursion, at any depth.
- **Blast radius ~50 files** across `contracts` + `platform` + `api-server` + seed — not a blocker (no users, nothing to migrate), exactly as ADR-0037/0038 framed their own removals.
- **Initiative decision logs are superseded forward, not edited.** The ADR-0037 §Deferred parallel-interleave clause and any `D-`numbered records pinning the inert sub-axes are append-only history; this ADR is their forward-looking reversal.

## Alternatives considered

Three calls were resolved at the **aggressive-migration default** (this project bans speculative back-compat: no users, non-prod DB, solo dev). Each is recorded with the conservative alternative that was rejected.

1. **F4 refusal scaffolding: delete wholesale vs. keep a typed refusal channel.**

   - **Chosen:** delete. `range` was the channel's only trigger; with it gone the inverse mapper is total, and the refusal shells (`is-compose-editable`, `InverseRefusalReason`, the refusal modal state) are dead code. The model bans dead shells, and because `composition` is `Json`, a malformed stored `kind` already fails parse upstream — the editor never receives an unrepresentable container, so a runtime refusal path is unreachable anyway.
   - **Rejected:** keep the typed refusal channel for some future kind the editor cannot represent. That is speculative back-compat against a hypothetical — exactly the carrying cost this initiative exists to remove. If a future kind is genuinely uneditable, the channel is re-introduced against that real shape.

2. **Gauntlet B EMOM minute-boxes + the sole `window` seed block.**

   - **Chosen:** the per-minute child containers drop their inner `window` repetition (the **outer** cadence already expresses EMOM, so the inner window was redundant), and the one seed block authored as `window {0:00–20:00}` is re-authored to `timeCap { min: 20, unit: "min" }`. The const name and "20-min" header read correctly for a 20-min cap; renaming them would be needless importer churn.
   - **Rejected:** preserve a `window` representation by some other encoding. There is no engine that reads a wall-clock window; a 20-min cap is the faithful, supported expression of the same intent.

3. **`wave` / `drop_set` / `cluster` seed blocks under the dropped `programKind`.**
   - **Chosen:** degrade the affected seed blocks to `{}` (a valid, classifier-less container), preserving the surrounding schema/row/coverage assertions (e.g. `rounds(5)` + RestSpec on the former `cluster` block).
   - **Rejected:** keep a `programKind` value on those blocks. The classifier drove no behaviour; retaining it would re-introduce the exact inert field being removed.

## References

- ADR-0037 — compose-only plan-content model (the deferred scoring/execution surface this ADR continues to drain).
- ADR-0038 — remove the inert scoring axis + `freezeLoadsAtCreation` stub (the immediately preceding removal; this ADR removes the parallel-interleave surface it scoped out).
- ADR-0019 — dev DB reprovisioned via `db:reset` / `db:push`; no `prisma/migrations/`.
- `packages/api-server/prisma/seed/plan-data/coverage-matrix.md` — `§17` removal + the supersede banner naming this ADR.
