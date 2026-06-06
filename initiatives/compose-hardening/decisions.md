# compose-hardening — decisions

D-numbered ratified decisions. Step-level calls that don't merit a full ADR live here; cross-initiative architecture calls go to `docs/adr/`. **Promote here at every gate.** The SSOT for "why."

**Status legend:** `RATIFIED` (decided + acted) · `OPEN` (awaiting user ratification — do not execute past it) · `SUPERSEDED` (replaced — kept for the trail).

**Legitimacy lens for any primitive/axis decision:** FOUR-PROJECTION INVARIANCE — a primitive is legitimate iff it means the same across (1) coach SETS, (2) athlete EXECUTES, (3) RENDER, (4) ANALYTICS. Memory: `[[compose-four-projection]]`.

## Index

| ID               | Topic                                                              | Status   |
| ---------------- | ------------------------------------------------------------------ | -------- |
| D-1              | Initiative origin: audit → compose-hardening, scope = Tiers 0–3    | RATIFIED |
| D-ONTOLOGY       | program/slot home: rowKind+VO vs 5th-axis vs nested-schema         | **OPEN** |
| D-EDIT           | edit-mode shape: inverse adapter + edit drawer + save-via-update   | RATIFIED |
| D-SCORING-RENDER | inert `scoring` presentation: static-disabled in editor (Option A) | RATIFIED |
| D-MARKER         | `INNER_LADDER_MARKER`: deprecate-vs-seed                           | **OPEN** |

---

### D-1 — Initiative origin: the audit is the plan

- **Status:** RATIFIED (2026-06-05).
- **Decision.** The 2026-06-05 state-of-the-feature audit (`audit-findings.md`) becomes a tracked initiative, `compose-hardening`, owning Tiers 0–3. It is a **new** initiative (not a resume of `plan-editor-compose`, whose build-arc is concluded), because the scope is different: finish the authoring surface + correctness + read honesty, not the archetype→axes model migration (done).
- **Rationale.** Owner directive: "все дефекты и дыры — это теперь наш план, фиксируй в рабочий флоу." The project's flow for multi-session work is the initiatives system; promotion discipline says findings live in `deferred.md`, not a chat. The audit re-confirmed zero model drift, so the remaining work is a finishing initiative on a clean foundation, not a rescue.
- **Links.** `audit-findings.md`; Workflow `wf_fc0a986c-5ae`; [[plan-editor-compose]] (concluded); ADR-0037.

### D-ONTOLOGY — where program/slot lives (OPEN)

- **Status:** OPEN — awaiting ratification. **Do not execute plan 0b past this.**
- **The question.** Wave/cluster/drop-set/named-program/EMOM-slot are unauthorable + flatten on input (T0-2). Where does `StagedProgram`/`SlotSpec` belong? (i) a new `rowKind` variant carrying the existing `stagedProgram` VO in `schemaRowPayloadSchema` (+ Prisma column + form + seed); (ii) a 5th composition axis on the container; (iii) a nested schema via `parentSchemaId` with per-stage load.
- **Leaning (not ratified).** (i) — the VO is already written + tested, lowest friction, keeps program a leaf concern (algebra §1 once called it a "sacred Row-VO"; `DEFER-001` found it "was always an archetype param" — but as a _row payload_ it can be a legit leaf, distinct from the archetype catalog). (ii) requires a four-projection proof that program is a container property. Resolve before any code.
- **Touches.** FROZEN contract (`schema-row` payload union) → Gate-A escalation for (i)/(ii). Prisma column. Disposes T3-CT-1 (zombies).

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
