# compose-hardening — decisions

D-numbered ratified decisions. Step-level calls that don't merit a full ADR live here; cross-initiative architecture calls go to `docs/adr/`. **Promote here at every gate.** The SSOT for "why."

**Status legend:** `RATIFIED` (decided + acted) · `OPEN` (awaiting user ratification — do not execute past it) · `SUPERSEDED` (replaced — kept for the trail).

**Legitimacy lens for any primitive/axis decision:** FOUR-PROJECTION INVARIANCE — a primitive is legitimate iff it means the same across (1) coach SETS, (2) athlete EXECUTES, (3) RENDER, (4) ANALYTICS. Memory: `[[compose-four-projection]]`.

## Index

| ID               | Topic                                                                 | Status   |
| ---------------- | --------------------------------------------------------------------- | -------- |
| D-1              | Initiative origin: audit → compose-hardening, scope = Tiers 0–3       | RATIFIED |
| D-ONTOLOGY       | program/slot home: rowKind+VO vs 5th-axis vs nested-schema            | **OPEN** |
| D-EDIT           | edit-mode shape: inverse adapter + edit drawer + save-via-update      | **OPEN** |
| D-SCORING-RENDER | inert `scoring` presentation: hide-in-editor vs read-only draft-badge | **OPEN** |
| D-MARKER         | `INNER_LADDER_MARKER`: deprecate-vs-seed                              | **OPEN** |

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

### D-EDIT — edit-mode shape (OPEN)

- **Status:** OPEN. **Do not execute plan 0a past this.**
- **The question.** How to give the drawer an edit path (T0-1). Shape: an inverse adapter `Composition + SchemaWithBody subtree → ComposeProgram/ComposeContainer` carrying real `schemaId`s, then an edit-mode `ComposeEditorDrawer` that hydrates from it and routes Save through `update` (lifting the existing arrangement-wiring `updateSchema`-with-composition path into a general edit-persist). Open sub-questions: per-node update vs whole-subtree replace; how edits to nested structure (add/remove/reparent) map to create+delete+update; whether the prototype route (`/coach/compose-prototype`, which already accepts `initialProgram`) becomes the edit harness.
- **Leaning.** Inverse adapter first (it's the true blocker); then edit-drawer. Decide the update granularity at the `/feature` research stage (it owns the blast-radius), not here.

### D-SCORING-RENDER — inert scoring presentation (OPEN)

- **Status:** OPEN.
- **The question.** `scoring` is present-but-inert until ph.5, yet read cards show it as an active fact (T2-1) and an edit-mode would expose a control that computes nothing. Hide scoring in the editor until ph.5, or show it read-only with a "draft/not-yet-scored" badge on both card + editor?
- **Note.** Whatever ships, it must not imply execution. Ties to the ph.5 inert-tripwire — do not remove the guard here.

### D-MARKER — INNER_LADDER_MARKER deprecate-vs-seed (OPEN)

- **Status:** OPEN.
- **The question.** The seed expresses parallel-ladders via `container.repetition.ladder` (block-037); the row-payload `INNER_LADDER_MARKER` ladder has 0 seed instances and lives only in the four-projection test (T3-SEED-5). Either (a) ratify marker-via-row as deprecated in favour of container-ladder (then it's an inert-tripwire to drop with ph.5 — see `[[compose-ph5-seed]]`), or (b) seed ≥1 marker + a full Gauntlet Block C so the read pipeline is exercised on live data.
- **Note.** The four-projection split (D-LADDER) proved the two ladders are distinct primitives — dropping the row form would narrow expressiveness; weigh against whether any real coach plan needs per-track personal rep-schemes that a container-ladder can't carry.
