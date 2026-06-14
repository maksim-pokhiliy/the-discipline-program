# W4-editor live-test follow-ups — batch for one run

Live browser testing of the session-primitive constructor (2026-06-14). Small UI fixes landed in-stream on `main`/PR; **contract / cross-package reversals are collected here for ONE batched run** (e.g. `/feature`), because each reverses a ratified decision and touches contracts + api-server (gated suite) and may need `db:reset` + re-seed.

**This list is NOT final — append as more surfaces during testing.**

---

## Batched run — one feature pass

A = tempo (contract + platform). B = schema-group creation (UI/UX + minimal contract, **domain unchanged**). D/E below. Scope lines come from recon done this session; the gated api-server suite is needed only where contracts/endpoints actually change (A, the minimal group-create in B, E).

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

### B. SCHEMA GROUPS created like row groups — UI/UX only (changes the W3 add-group FLOW, not the domain)

- **Decision:** create schema groups by selecting 2+ schemas → "Group" (mirror the row-group flow), NOT the "Add group" instant parallel-ladder seed. Strip the left vertical bar + ordinal-in-circle. Rename "Add track" → "Add schema to group" (styled like the `+ Add row` text button).
- **Domain UNCHANGED (owner, 2026-06-14):** a schema group stays a PARALLEL group (`interleaveOrder` lives). This is purely a creation-UX + visual change — NOT a parallel-vs-box question. Do not redesign the parallel model; only the create path and visuals change.
- **Scope:**
  - visual strip: `group-track-wrapper.tsx` (rail `::before` + `pl`), delete `group-track-badge.tsx`.
  - delete add-group flow: `add-group-button.tsx`, `group-into-box-checkbox.tsx`, and (conditionally) `use-create-group.ts` / `build-group-create-request.ts` / `parallel-ladder-draft.ts` (`materializeParallel`), the AxisEditorModal group branch (`submitGroupCreate` / `submitIndependentLadders`).
  - new (mirror rows): schema select-mode in `block-card-body.tsx` (cf. `schema-row-list.tsx` `isSelectMode`/`selectedIds`/`RowGroupSelectBar`), `schema-card` checkbox, `build-schema-group-create-request`, `use-create-schema-group`.
  - contract: minimal — a create path that groups EXISTING schemas (set `schema.groupId`, mirror rowGroup `rowIds`), keeping parallel/`interleaveOrder` semantics. Do NOT change the parallel model.
  - rename: "Add track" → "Add schema to group" (#18).

---

## UI fixes already landed in-stream (2026-06-14) — context, no action

Row modal: removed equipment/movement chips; removed Demo URL + Demo label (demo lives on Exercise/admin); exercise select small; MUI floating labels everywhere (dropped manual caption labels); ModifierPicker size-aligned; Save no longer disabled — validate on submit with field-level errors (#25). Row summary: `5 × 20 @2x25kg [alternating] [3-1-X-0]` (sets `N ×`, reps bare, abs load `@…kg` / paired `@2x…kg`, side + tempo in `[ ]`, single-space join). Group rows: contiguity by list-position (gap-tolerant), checkbox normalized, "Group rows" as text button, row-group border-radius removed, grouped-row left indent removed. Edit-schema modal retitled. Pending UI (in-stream): #2 add-schema header+rest, #25 row-modal field-level errors.

---

## Appended later

### D. In-group drag-reorder (#29)

Reorder schemas within a SchemaGroup and rows within a RowGroup (grouped items currently render `isDraggable={false}`). Needs a sortable context inside the group box + a reorder mutation/endpoint. Pairs with the schema-group rework (B).

### E. Session creates with one block (#30)

A newly created session should come with one Block inside (currently empty). Decide: default block on api-server session-create (atomic, preferred), or client-orchestrated (create session → create block).

### Rest qualifier/scope no visual effect (#31/#32) — DONE in-stream (PR #266)

Was a read-surface gap: round-trip worked, but the schema summary rendered duration only. Fixed by wiring the orphaned `formatRestSpec` into `format-composition-summary`. No contract work.

### (removed) EXERCISE unfreeze — owner cancelled 2026-06-14: NOT doing it; `DR-W4E-EXERCISE-LOCK` stays in force.
