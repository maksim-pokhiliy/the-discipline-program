# compose-hardening — decisions

D-numbered ratified decisions. Step-level calls that don't merit a full ADR live here; cross-initiative architecture calls go to `docs/adr/`. **Promote here at every gate.** The SSOT for "why."

**Status legend:** `RATIFIED` (decided + acted) · `OPEN` (awaiting user ratification — do not execute past it) · `SUPERSEDED` (replaced — kept for the trail).

**Legitimacy lens for any primitive/axis decision:** FOUR-PROJECTION INVARIANCE — a primitive is legitimate iff it means the same across (1) coach SETS, (2) athlete EXECUTES, (3) RENDER, (4) ANALYTICS. Memory: `[[compose-four-projection]]`.

## Index

| ID               | Topic                                                                | Status   |
| ---------------- | -------------------------------------------------------------------- | -------- |
| D-1              | Initiative origin: audit → compose-hardening, scope = Tiers 0–3      | RATIFIED |
| D-ONTOLOGY       | program/slot home: stages=rows + thin `programKind` axis; delete VOs | RATIFIED |
| D-EDIT           | edit-mode shape: inverse adapter + edit drawer + save-via-update     | RATIFIED |
| D-SCORING-RENDER | inert `scoring` presentation: static-disabled in editor (Option A)   | RATIFIED |
| D-MARKER         | `INNER_LADDER_MARKER`: deprecate-vs-seed                             | **OPEN** |

---

### D-1 — Initiative origin: the audit is the plan

- **Status:** RATIFIED (2026-06-05).
- **Decision.** The 2026-06-05 state-of-the-feature audit (`audit-findings.md`) becomes a tracked initiative, `compose-hardening`, owning Tiers 0–3. It is a **new** initiative (not a resume of `plan-editor-compose`, whose build-arc is concluded), because the scope is different: finish the authoring surface + correctness + read honesty, not the archetype→axes model migration (done).
- **Rationale.** Owner directive: "все дефекты и дыры — это теперь наш план, фиксируй в рабочий флоу." The project's flow for multi-session work is the initiatives system; promotion discipline says findings live in `deferred.md`, not a chat. The audit re-confirmed zero model drift, so the remaining work is a finishing initiative on a clean foundation, not a rescue.
- **Links.** `audit-findings.md`; Workflow `wf_fc0a986c-5ae`; [[plan-editor-compose]] (concluded); ADR-0037.

### D-ONTOLOGY — where program/slot lives (RATIFIED 2026-06-06 · Gate-A)

- **Status:** RATIFIED (2026-06-06) — owner ruled the four-projection domain questions as coach authority; this ratification authorises the Gate-A `composition` contract change below. Executes in 0b (`/feature`, UI-first).
- **The question.** Wave/cluster/drop-set/named-program/EMOM-slot are unauthorable + flatten on input (T0-2). The board framed three homes for the `StagedProgram`/`SlotSpec` VOs: (i) a new `rowKind` carrying the fat `stagedProgram` VO as a row payload; (ii) a 5th composition axis carrying the VO on the container; (iii) nested sub-schemas. The leaning was (i).
- **The owner's four-projection ruling (the pivot).** Verify-then-spec on live code reframed the question before the answer:
  - **Q1 SET = "separate sets"** (not one atomic unit). A "separate set" (snatch 80%×2) is on live code literally **one `EXERCISE` row** with its own `load`/`reps` columns — not a payload-with-`stages[]`, not a sub-schema. `useComposeProgram.addRow` + `reorderChildren` already exist (`compose/use-compose-program.ts:92-95`) → N stage-rows are **already authorable**; the seed flatten (`phase-7-blocks.ts:152` = 1 row) was a seed-author shortcut, not a tool gap.
  - **Q2 ANALYTICS = per-stage** (tonnage per intensity band, 3 points). Fully carried by each row's `load`/`reps` — no new structure needed for the data.
  - **Q3 EMOM = window-centric.** EMOM minute-structure is already nested `window` sub-containers under `cadence` (`composition-gauntlet.test.ts` Gauntlet B); `slotSpec` is a redundant flatter alias, 0 consumers.
  - **Classification = needed** (owner: render badge + analytics grouping/intra-wave progression must know "these rows ARE a wave/cluster/drop_set").
- **Decision.**
  1. **Stages = sibling rows.** Wave/drop-set = N `EXERCISE` rows (per-stage `load`/`reps` on the row). Cluster `5×(3+3+3)` = container `repetition.count:5` over the stage-rows + `REST(scope:between_intervals)` (the pattern the seed already uses, `phase-7-blocks.ts:171`). named-program = the existing `scoring.progressive` path. **No new `rowKind`, no `stages[]` payload.**
  2. **Classification = a thin `programKind` field on `composition`** — `programKind: stagedProgramKindSchema.optional()` (reuses the KEPT `STAGED_PROGRAM_KINDS` enum: `drop_set`/`wave`/`cluster`). Group-level classifier → its home is the container's composition, next to `repetition`/`arrangement`/`scoring`/`rest`. **This is a Gate-A change to the FROZEN, charter-sacred `@repo/contracts/lms/composition` — authorised by this ratification.** Thin + additive (optional enum) = the safest frozen-contract change.
  3. **DELETE both fat VOs** — `stagedProgramSchema` + `stageSchema`/`Stage`/`StagedProgram` (`_shared/staged-program.ts`) and `slotSpecSchema`/`SlotSpec`/`SLOT_SPEC_KINDS` (`_shared/cap-spec.ts`, keep `restSpecSchema`). Remove from the `_shared` barrel + the gauntlet/unit tests. The fat VO's data redistributes: `stages[]`→rows, `setsCount`→`repetition.count`, `restBetweenStages`→`REST` rows, `mediaPerStage`→`row.media`, `separatorForm`→render-derived. **KEEP** `stagedProgramKindSchema` (now consumed by #2 — no longer a zombie).
- **Why M1 (thin `programKind` on `composition`) over M2 (a classifier `rowKind` marker, à la `INNER_LADDER_MARKER`).** (a) Classification is a property of the GROUP, not a row — `composition` is exactly "how the container's children compose". (b) The ratified D-LADDER split reads in favour: round-counter ladder (group/structural) → container axis `repetition.ladder`; rep-scheme (per-row data) → `INNER_LADDER_MARKER` row. `programKind` is a group classifier → container, like the round-counter. (c) Analytics-grouping robustness (the owner's Q2 concern): M1's group boundary = the container, stable under reorder; M2's = "the marker's siblings", implicit + reorder-fragile. (d) Cluster needs `repetition.count` on the container anyway → `programKind` co-locates with the count it classifies.
- **Why NOT the board's (i)/(ii)/(iii).** The owner's SET ruling ("separate sets") killed (i)'s atomic-unit premise — cramming independently-edited stages into one row's `stages[]` contradicts it. (ii) (fat VO on container) fails four-projection — per-movement stages on a heterogeneous container = analytics ambiguity (M1 ≠ (ii): M1 carries only the KIND label, stages stay in rows). (iii) (nested sub-schemas) over-models a "set" (a set is a row, not a container) + risks the depth-2 read truncation (`schema.mapper.ts:41`) for clusters + erases the discriminant. The audit's (i)-leaning assumed the atomic-unit model **untested against the coach** — exactly what this gated session corrected; the audit was not wrong-at-the-time, its premise was unratified.
- **Blast radius.** FROZEN contract: `composition.schema.ts` += `programKind` (Gate-A, sacred module); DELETE `staged-program.ts` + slot from `cap-spec.ts` + barrel + tests. **Prisma: none** (composition is `Json?`; no `rowKind` added; no column). Platform: `compose-tree.types.ts` composition draft += `programKind`; drawer/inspector `programKind` selector + render badge (`format-composition-summary`/`axes-summary`). Seed: re-author `block-163`/`164`/`008` as multi-row + `programKind` (also fixes the `block-008` duplicate, T3-SEED-2).
- **Disposes.** **T3-CT-1 fully** — `slotSpec` deleted, `stagedProgram` fat-VO deleted, the surviving `stagedProgramKindSchema` now consumed. program-flatten (re-authored as rows). T3-ARCH-1 unaffected (06-formalization stays quarantine).
- **Open follow-ups for 0b** (do not block ratification): per-stage execution cue `STAGE_INDICATORS` (`explode`/`without_weight`) — rehome onto a row field/notes or delete (it orphans when `stageSchema` dies); `without_weight` is already expressible via the `withoutWeight()` load VO. Whether `programKind` needs a movement-homogeneity `superRefine` (a "wave" container's rows should be one movement) — decide at design.
- **Reversibility.** The `programKind` field is additive/optional — two-way door. The VO deletes are one-way but safe (0 production consumers, verified by repo-wide grep 2026-06-06).
- **Links.** T0-2 / T3-CT-1 (`deferred.md`); `[[compose-four-projection]]` (the legitimacy lens); `[[compose-ph5-seed]]` (DEFER-001 origin); `composition-gauntlet.test.ts` (Gauntlet A/B evidence).

### D-EDIT — edit-mode shape (RATIFIED 2026-06-06)

- **Status:** RATIFIED (2026-06-06) — ratified at `/feature` Gate A, implemented + shipped on `feat/compose-edit-mode` (commits `990b7164`, `1de6c958`, `b528e784`, `7380801a`, `792888ea`).
- **Decision.** An **axis-only EDIT path** for an existing top-level compose schema, via three net-new client-side pieces — **no Prisma / contract / endpoint change**:
  1. **Inverse adapter** (`compose/lib/schema-to-compose.ts`) — `schemaWithBodyToComposeProgram(schema): InverseResult` (+ `schemaWithBodyToComposeContainer`, `isComposeEditable`). Maps a persisted `SchemaWithBody` subtree → the platform draft `ComposeProgram`, **keeping every real cuid as the draft `NodeId` via `asNodeId`** — so `arrangement` refs (stored as real cuids) round-trip with zero remap (the keystone that made this cheap). Splits `Schema.composition` into the four draft axes; hydrates each row's `editorDraft` via the existing `ROW_PAYLOAD_FORM_REGISTRY[kind].toValue({kind:"edit",row})`. Authoring-side only (no read leak).
  2. **Drawer `mode` prop** — `ComposeEditorDrawer` gains `mode?: {kind:"create"} | {kind:"edit"; schema}` (mirrors `RowEditorMode`), **optional, defaulting to create** → the existing create call site stays byte-identical. Edit-entry = a per-`SchemaCard` "Edit axes" IconButton in `SchemaCardHead`, gated `!isSubSchema` (mirrors the delete affordance).
  3. **Per-node save-via-update** — `diffComposeAxesAgainstOriginal(original, editedRoot): DiffResult` → `SchemaCompositionUpdate[]` (one per changed container, keyed by real schemaId); `useEditComposeAxes.saveEdits` fires one `updateSchema.mutateAsync({schemaId, data:{composition}})` per change — the exact update-with-composition wire lifted out of `use-persist-compose-cascade.ts:54`.
- **Resolved sub-questions** (decided at the `/feature` research stage on live-code evidence): (a) **per-node update**, NOT whole-subtree replace (replace = delete+recreate under the hood — id churn, partial-save failure mode, guard asymmetry); (b) **axis-only scope, structural deferred** — add/remove/reparent are OUT (reparent is impossible via `update` anyway — `STRUCTURAL_UPDATE_KEYS` blocks `parentSchemaId`/`blockId`); arrangement re-pointing among EXISTING children is IN; (c) the **real drawer**, NOT the mock-only `/coach/compose-prototype`.
- **Invariants shipped (beyond the bare shape, hardened during review/QA):**
  - **Scoring-verbatim (HARD):** the edit path never routes stored `scoring` through the lossy `mapScoring` (which drops `condition`); the diff re-emits the original `scoring` byte-for-byte. A seeded `scoring.condition` survives an unrelated-axis edit (tripwire-tested). Closes the T1-2 strip for the edit path.
  - **Structural-divergence guard:** the diff fail-closes (`{ok:false, reason:"structural-divergence"}`) on any add/remove/reparent/root-sibling, via an id→parent linkage map + `children.length===1` — defense-in-depth behind the UI affordance-disabling, so a structural edit can NEVER silently drop. (Stronger than the design's "1:1 by schemaId".)
  - **Range-refuse:** `{kind:"range"}` repetition (unrepresentable in the draft — extending it = T3-CT-4, an explicit non-goal) is gracefully refused (edit affordance disabled + tooltip, never a silent drop). Datum: 0 `range`-repetition instances in seed.
  - **Edit-mode is axis-only at the UI too:** structural affordances (add/duplicate/delete/reorder, incl. the upper-row Duplicate) hidden; header/notes read-only (rename stays on the card).
- **Consequences.** The create-only blocker is removed; coaches edit existing block axes with no data loss. The edit path is a _guarded_ write (inherits the validated side of the T1-1 asymmetry). Additive — the create path is untouched.
- **Reversibility.** Two-way door — net-new pure modules + an optional prop + one button; revert = delete them. No contract/schema/data migration.
- **Deferred follow-ups** (from the review/QA pass): QA-103 (edit-mode arrangement validation parity), REV-W2 (`isComposeEditable` read→`compose/lib` boundary edge), QA-201 (multi-PUT N>1 partial), QA-302 (lazy-seed footgun) — see `deferred.md`.

### D-SCORING-RENDER — inert scoring presentation (RATIFIED 2026-06-06)

- **Status:** RATIFIED (2026-06-06) — Gate A; shipped with D-EDIT.
- **Decision — Option A: `scoring` is NON-EDITABLE in the T0-1 editor.** The `<ScoringAxisField>` renders **static-disabled** in edit-mode (shows the stored kind, greyed, not authorable), via an `isCreateMode` flag threaded drawer→inspector; create-mode keeps it fully editable. This governs the EDITOR only — the read-CARD honesty cue (T2-1) stays a separate Tier-2 item.
- **Why it cannot imply execution.** Disabling an input is pure presentation — it introduces no `computeScore`/`evaluateScoring`/`score(` symbol and no digit in any scoring badge. The inert tripwire `scoring-axis-is-inert.test.ts` is untouched and stays green.
- **Reconciliation with the D-EDIT scoring-verbatim invariant.** Because scoring is non-editable, the editor never emits a draft-reconstructed scoring; combined with the diff re-emitting the original verbatim, the scoring round-trip is provably lossless from both directions.
- **Reversibility.** Two-way door — one boolean. ph.5 conditional-scoring authoring flips it editable by dropping the disable (the flag will split from header-editability at that point).
- **Note.** The same `isCreateMode` flag also locks header/notes read-only in edit-mode (QA-102 fix); the flag is honestly named for "create vs edit", not the original `isScoringEditable`.

### D-MARKER — INNER_LADDER_MARKER deprecate-vs-seed (OPEN)

- **Status:** OPEN.
- **The question.** The seed expresses parallel-ladders via `container.repetition.ladder` (block-037); the row-payload `INNER_LADDER_MARKER` ladder has 0 seed instances and lives only in the four-projection test (T3-SEED-5). Either (a) ratify marker-via-row as deprecated in favour of container-ladder (then it's an inert-tripwire to drop with ph.5 — see `[[compose-ph5-seed]]`), or (b) seed ≥1 marker + a full Gauntlet Block C so the read pipeline is exercised on live data.
- **Note.** The four-projection split (D-LADDER) proved the two ladders are distinct primitives — dropping the row form would narrow expressiveness; weigh against whether any real coach plan needs per-track personal rep-schemes that a container-ladder can't carry.
