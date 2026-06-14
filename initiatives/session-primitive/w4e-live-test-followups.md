# W4-editor live-test follow-ups — batch for one run

Live browser testing of the session-primitive constructor (2026-06-14). Small UI fixes landed in-stream on `main`/PR; **contract / cross-package reversals are collected here for ONE batched run** (e.g. `/feature`), because each reverses a ratified decision and touches contracts + api-server (gated suite) and may need `db:reset` + re-seed.

**This list is NOT final — append as more surfaces during testing.**

---

## Contract-reversals — do in one batched run

Each is cross-package (contracts → api-server → platform), reverses a ratified decision, and needs the gated api-server suite. Scope lines below come from recon done this session.

### A. TEMPO → smart union (EXTENDS D-TEMPO, not supersede)

- **Decision (RATIFIED this session by owner, 2026-06-14):** tempo is a SMART UNION — `TempoModifier (structured 4-digit) | string (free)`. The resolver gets smarter: "3-1-X-0" → parses to the structured `TempoModifier` (D-TEMPO's typed path stays, engine-ready); "slow tempo" → falls back to a free string. Coach writes whatever; standard notation is still captured typed.
- **Rationale:** keeps the 4-digit typed (a future engine/analytics can still read it) AND lets the coach write verbal ("slow tempo"). Both, not either/or.
- **D-TEMPO / D-MODIFIER:** D-TEMPO is EXTENDED, not superseded — 4-digit stays typed. D-MODIFIER boundary softens: verbal tempo may live as a free string in the tempo field (no longer forced into a modifier).
- **Scope:**
  - contract: `packages/contracts/src/entities/lms/_shared/tempo.ts` — keep `tempoModifierSchema`; tempo field becomes `z.union([tempoModifierSchema, z.string().max(N)])`. Update refs in `schema-row.schema.ts:25,40`.
  - platform: `parse-tempo.ts` — try the 4-token parse → structured; on no-match return the trimmed string (NO error; fallback). `format-tempo.ts` + `format-tempo-input.ts` + `format-row-builders.ts` tempo branch — handle both (`typeof tempo === "string" ? tempo : formatTempo(tempo)`). `build-row-request.ts`.
  - api-server: Prisma `SchemaRow.tempo Json?` already flexible (NO migration); `marshalNullableJson` works for object OR string.
  - seed: existing ~67 corpus tempos are 4-digit → still parse to structured, so **likely NO re-express / NO db:reset** (they stay valid in the union). Just confirm none rely on a now-rejected form.
  - tests: `parse-tempo.test` (ADD free-string fallback cases, KEEP 4-digit), `format-tempo.test`, `build-row-request.test`, contracts vo-parity, api-server `admin.test`.
  - docs: add `D-TEMPO-SMART` (extends D-TEMPO) to `decisions.md`; update `primitive-spec.md` tempo row + `deferred.md` F-TEMPO.

### B. EXERCISE unfreeze on edit (reverses DR-W4E-EXERCISE-LOCK)

- **Decision (owner leaning yes; needs final confirm):** allow changing a row's exercise in the Edit-row modal. Currently locked — `DR-W4E-EXERCISE-LOCK` (2026-06-13): exercise is an identity invariant, change = delete+re-add.
- **OPEN domain Q (resolve before doing):** do any athlete performance-logs reference `row.exercise`? If yes, changing it on a published plan rewrites history — only safe if this stays authoring-only.
- **Scope:**
  - contract: `schema-row.schema.ts` `updateSchemaRowSchema = createSchemaRowSchema.omit({schemaId, exerciseId}).partial()` → stop omitting `exerciseId`.
  - api-server: `endpoints/lms/schema-row/admin.ts` update handler — apply `exerciseId`.
  - platform: `row-editor-modal.tsx` remove `disabled={!isCreate}` on `ExercisePicker`; remove `EXERCISE_LOCK_HINT`; update `row-editor-modal.test` (the DR-W4E-EXERCISE-LOCK test).
  - docs: supersede `DR-W4E-EXERCISE-LOCK` in `decisions.md`.

### C. SCHEMA GROUPS created like row groups (reverses W3 D2/D3)

- **Decision:** create schema groups by selecting 2+ schemas → "Group" (mirror the row-group flow), NOT the "Add group" instant parallel-ladder seed. Strip the left vertical bar + ordinal-in-circle. Rename "Add track" → "Add schema to group" (styled like the `+ Add row` text button).
- **OPEN domain Q (resolve before doing):** does a schema group still mean PARALLEL execution (`interleaveOrder`), or just a visual box around schemas? Determines whether parallel-track semantics survive at all.
- **Scope:**
  - visual strip: `group-track-wrapper.tsx` (rail `::before` + `pl`), delete `group-track-badge.tsx`.
  - delete add-group flow: `add-group-button.tsx`, `group-into-box-checkbox.tsx`, and (conditionally) `use-create-group.ts` / `build-group-create-request.ts` / `parallel-ladder-draft.ts` (`materializeParallel`), the AxisEditorModal group branch (`submitGroupCreate` / `submitIndependentLadders`).
  - new (mirror rows): schema select-mode in `block-card-body.tsx` (cf. `schema-row-list.tsx` `isSelectMode`/`selectedIds`/`RowGroupSelectBar`), `schema-card` checkbox, `build-schema-group-create-request`, `use-create-schema-group`.
  - contract: `createGroupRequest {blockId, tracks≥2}` → likely new `{blockId, schemaIds}` (mirror rowGroup `rowIds`) + api-server group-create that sets `schema.groupId` on the selected schemas.
  - rename: "Add track" → "Add schema to group" (#18).

---

## UI fixes already landed in-stream (2026-06-14) — context, no action

Row modal: removed equipment/movement chips; removed Demo URL + Demo label (demo lives on Exercise/admin); exercise select small; MUI floating labels everywhere (dropped manual caption labels); ModifierPicker size-aligned; Save no longer disabled — validate on submit (field-level errors pending, #25). Row summary: `5 × 20 @2x25kg [alternating] [3-1-X-0]` (sets `N ×`, reps bare, abs load `@…kg` / paired `@2x…kg`, side + tempo in `[ ]`, single-space join). Group rows: contiguity by list-position (gap-tolerant), checkbox normalized, "Group rows" as text button, row-group border-radius removed, grouped-row left indent removed. Edit-schema modal retitled. Pending UI (in-stream): #2 add-schema header+rest, #25 row-modal field-level errors.

---

## Appended later

### D. In-group drag-reorder (#29)

Reorder schemas within a SchemaGroup and rows within a RowGroup (grouped items currently render `isDraggable={false}`). Needs a sortable context inside the group box + a reorder mutation/endpoint. Pairs with the schema-group rework (C).

### E. Session creates with one block (#30)

A newly created session should come with one Block inside (currently empty). Decide: default block on api-server session-create (atomic, preferred), or client-orchestrated (create session → create block).

### Rest qualifier/scope no visual effect (#31/#32) — UNDER RECON

RestSpecFields `scope` + `qualifier` toggles appear to do nothing. Recon in flight: either a round-trip shape mismatch (`RestSpec` vs `RestSpecFormValue`, or the save path drops them) or rest is simply not rendered in the schema read-surface (so changes are invisible after close). If UI-only (binding/read-surface) → fix in-stream; if it needs contract work → it moves up here.
