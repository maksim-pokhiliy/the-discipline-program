# W4-editor — runner prompt (session-primitive)

**You are the runner for the W4-editor wave.** This prompt is self-contained — your session has none of the initiative chat context. Run it as a full `/feature` pipeline (design → implement → review → QA), surfacing real forks at Gate A. ONE `/feature` run, this session (house budget).

**One-line scope:** build the proto-faithful **row authoring UX** over the already-shipped W4 leaf data layer — the row form (exercise-select-first), the modifier picker (searchable + create-on-the-fly), the row-group box + grouping gesture, the notes multi-list editor, `sets`/`count` authoring, and in-group schema header parity. **Platform-only, EXCEPT one thin api-server endpoint** (the coach modifier-create — §3 D3).

---

## 1. Context — read first, and the binding rules

**Initiative:** `session-primitive` (the redesign of the training session primitive `Session → Block → [SchemaGroup?] → Schema → [RowGroup?] → Row`). Read, in order:

- `initiatives/session-primitive/charter.md` — goal + sacred list.
- `initiatives/session-primitive/decisions.md` — **binding for this wave:** `D-ROW-GRAMMAR` (one row kind, nature inferred, `sets` free), `D-LOAD-FINAL` (load shapes), `D-TEMPO` (4-digit + X), `D-MODIFIER` (the modifier library + the searchable create-on-the-fly picker = the wave's rationale), `D-PLAQUE` (notes = multi-list on any element; row-group = mirror of Group one floor down), `D-FLOORS` (intensity is **schema-only**), `D-HEADER-KEEP` (header parity). The **editor patterns to mirror**: `DR-W3-2` (proto card platform-local, the no-hex palette mapping), `DR-W3-4/5/6` (gesture hooks), `DR-W3-11` (`pointerFirstCollision`), `DR-W3-12` (house pending-modal pattern), `DR-W3-REENTRY` (re-entry guards on modal-less buttons). The data layer: `DR-W4-2` (modifier write = `modifierIds[]` set-replace), `DR-W4-RG-CREATE` (row-group create wraps existing contiguous rows), `DR-W4-3` (row collapse; loose `exerciseId`).
- `initiatives/session-primitive/deferred.md` — **this wave OWNS:** `W4R-001/QA-002` (row-group create overlap guard), `W4R-005` (notes round-trip), `W4-COACH-MODIFIER` (coach create-on-the-fly), `W4-HEADER-PARITY`. Note (do NOT action): `W4-EXEC-DEFER` (execution/scoring semantics stay notes — no inert fields).
- `initiatives/session-primitive/primitive-spec.md` §3 (Grid A — row payload), §4 (Grid B — row modifiers), §5 (Grid C — schema/block/groups). **FROZEN.** §3 result line is the row's shape.
- `initiatives/session-primitive/plan.md` §W4 (this wave's place).

**The LIVE law of `main` (what already shipped — do NOT rebuild):**

- **W4-model** shipped the leaf DATA layer: the row is one kind (`exerciseId` loose + `sets?` + `reps` + `load` + `side` + `tempo?` + `media` + `modifiers[]` read embed + `notes[]`); two new entities (`Modifier` library, `RowGroup`); the leaf VOs reshaped. The platform **renders** off these contracts (`schema-row-card.tsx`, `row-group-box.tsx`, the formatters), but **Add-row / Edit-row are stubbed `disabled`** ("coming in W4-editor"). `sets` and `load.absolute.count` already RENDER (e.g. "×3", "2× 65 kg") — they just can't be authored.
- **W3** shipped the **schema-group** box card + the full gesture set (Add group / Add track / Ungroup / Delete-with-members), the **`AxisEditorModal`** (composition + rest + **schema intensity**), the house pending-modal pattern, `pointerFirstCollision`, and the flat authoring draft. **W4-editor does NOT touch any of this** — the schema/block/group chrome and the schema composition+intensity editor are DONE. W4-editor adds ONLY the **leaf** (row + row-group + modifier).

**The UX-language law — the `plan-editor-hi-fi-v-2` bundle.** The owner supplies it (a Claude Design handoff: `project/row-editor.jsx`, `cards.jsx`, `exercise-picker.jsx`, `axis-editor.jsx`, `primitives.jsx`, `editor.css`, `assets/colors_and_type.css`). It is the **interface-language law** (modal shape, `.seg` controls, `Field` pattern, the row-card grid, the select-mode grouping, "edit-via-the-tune-icon", Cancel/Save modals). **CRITICAL: the prototype LAGS the model** — its `axis-editor.jsx` is contract-faithful (already built in W3), but its `row-editor.jsx` is on the **OLD leaf** (4 row kinds, exercise-form atomic/compound/or_alternative, `weight.variant`, `position`/`sequence` dropdowns, single note, intensity-on-row). **Take the LANGUAGE, map the DOMAIN onto the W4 contracts via the table in §2.** Do not copy the prototype's payload shapes.

---

## 2. The prototype → W4 mapping (do NOT copy old payloads)

`row-editor.jsx` is the old leaf. Build the modal with its **visual language** but these field substitutions:

| Prototype field (old leaf)                                   | W4 contract                                                                                                      | Action                                                                                                                              |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Row-kind `.seg` (EXERCISE/REST/PLACEHOLDER/REST_SLOT)        | one row kind; render-kind inferred from the exercise's `placeholderFlag`                                         | **DROP.** First step IS the exercise select (a normal movement, a placeholder slot, or the seed Rest exercise — all are exercises). |
| Exercise-form `.seg` (atomic/compound/or_alternative)        | compound / OR → **row-groups**                                                                                   | **DROP.** The row is atomic. Compound / "OR" / per-set are built via the row-group gesture (§3 D4).                                 |
| Load `absolute → weight.variant` select                      | `load.absolute { count: 1\|2, kg }`                                                                              | Replace the variant select with a **[1× \| 2×]** seg + a **Weight (kg)** field.                                                     |
| Load `byProfile { first, second }`                           | `load.byProfile { entries: { label, kg }[] }` (≥1)                                                               | Replace the two fixed inputs with an **add/remove list** of `(label, kg)` rows (label = coach dictionary: m/f, RX/SC, …).           |
| Load `percentage.reference` (self / other / movement_family) | `percentage { value, rangeMax?, reference: { scope: "self" } \| { scope: "other_exercise", targetExerciseId } }` | **Drop movement_family.** Keep Percent + Max% (optional) + reference [This exercise \| Other exercise → ExercisePicker].            |
| Load `none` kind                                             | dropped (bodyweight covers it)                                                                                   | **Remove None.** The seg is exactly **Absolute / % 1RM / Bodyweight / By profile**.                                                 |
| `Position` select                                            | position → the **modifier library**                                                                              | **DROP → the Modifier picker** (§3 D2).                                                                                             |
| `Sequence` select                                            | sequence → notes / order                                                                                         | **DROP** (→ a note if the coach wants the prose).                                                                                   |
| Row intensity (RPE / HR / Effort)                            | intensity is **schema-only** (D-FLOORS)                                                                          | **DROP from the row.** (Schema intensity is edited in the already-shipped `AxisEditorModal`.)                                       |
| Single "Row note" input                                      | `notes: string[]`                                                                                                | Replace with the **NotesListEditor** (§3 D5).                                                                                       |
| _(no sets field in the prototype)_                           | `sets: int?`                                                                                                     | **ADD** a Sets field (§3 D6).                                                                                                       |
| Tempo text `3-1-X-0`                                         | `tempo { eccentric, pauseBottom, concentric, pauseTop }`, each `int(0..60) \| "X"`                               | **KEEP** — a 4-digit text input parsed to the four positions (X allowed).                                                           |
| RepsField `.seg` count/range/unit_bound/max                  | `reps` discriminated union (same kinds)                                                                          | **KEEP** — matches; `null` reps = inherit from ladder (don't store "implicit").                                                     |
| Side select                                                  | `side { each_leg \| each_arm \| explicit_split{left\|right} \| alternating }` + `countPerLimb?`                  | **KEEP** — add the optional per-limb count for each_leg/each_arm.                                                                   |
| media (demo)                                                 | `media { url, label? }`                                                                                          | **KEEP** — a Demo URL field (valid URL) + optional label.                                                                           |

The verbatim W4 contracts (from `packages/contracts/src/entities/lms/`) you are authoring:

```ts
// _shared/load.ts
loadSchema = discriminatedUnion("kind", [
  { kind: "absolute", count: 1|2, kg: number>0 },
  { kind: "percentage", value: 0..200, rangeMax?: 0..200 (> value), reference: {scope:"self"} | {scope:"other_exercise", targetExerciseId: cuid} },
  { kind: "bodyweight" },
  { kind: "byProfile", entries: { label: nonEmpty, kg: number>0 }[] (min 1) },
])
// _shared/tempo.ts  — tempoModifierSchema === fullTempoSchema
fullTempoSchema = { eccentric, pauseBottom, concentric, pauseTop }   // each: int 0..60 | "X"
// _shared/side.ts
perLimbDistributionSchema = discriminatedUnion("kind", [
  { kind:"each_leg", countPerLimb?: int>0 }, { kind:"each_arm", countPerLimb?: int>0 },
  { kind:"explicit_split", side: "left"|"right" }, { kind:"alternating", sourceAnnotation?: string },
])
// _shared/reps.ts
repNotationSchema = discriminatedUnion("kind", [
  { kind:"count", value:int>0 }, { kind:"range", min:int>0, max:int>0 (min<max) },
  { kind:"unit_bound", unit:"sec"|"min"|"km", value?:num>0 | range?:{min,max} (exactly one) },
  { kind:"max", tail?: nonEmpty },
])
// _shared/notes.ts  — NOTE_MAX_LENGTH 2000, NOTES_MAX_COUNT 50
notesListSchema = array(string.trim().min(1).max(2000)).max(50)
// _shared/media.ts
mediaReferenceSchema = { url: string.url(), label?: nonEmpty }
// schema-row/schema-row.schema.ts  — SCHEMA_ROW_CONSTANTS: MAX_MODIFIERS_PER_ROW 20
createSchemaRowSchema = { schemaId, exerciseId, sets?:int>0|null, load?, reps?, side?, tempo?, media?,
                          modifierIds?: cuid[].max(20).unique, notes?: notesList|null }
updateSchemaRowSchema = createSchemaRowSchema.omit({schemaId, exerciseId}).partial()
//   ↑ NOTE: NO rowGroupId on create/update — membership is set ONLY via the row-group route.
// row-group/row-group.schema.ts  — ROW_GROUP_CONSTANTS: MAX_ROWS_PER_GROUP 30
createRowGroupRequestSchema = { schemaId, rowIds: cuid[].min(2).max(30).unique, notes?: notesList|null }.strict()
updateRowGroupRequestSchema = { notes?: notesList|null }.strict()
createRowGroupResponseSchema = { group: rowGroup, members: schemaRow[] }
// modifier/modifier.schema.ts + modifier-api.schema.ts  — MODIFIER_CONSTANTS.MAX_NAME_LENGTH 200
modifierSchema = { id, name(1..200), nameLower, notes: notesList|null, createdAt, updatedAt }
createModifierRequestSchema = createModifierSchema = { name: normalized(200), notes?: notesList|null }
modifierSearchParamsSchema = { q?: string(1..200) }
// modifierRefSchema === modifierSchema (the read embed on the row, sorted by assignment order)
```

---

## 3. Deliverables

Each names the concrete surface; **corrections welcome** — verify in code at the design stage (§5) and re-spec if a surface is mislocated. Reuse-before-invent: the plumbing already exists where noted.

### D1 — the row form (exercise-select-first)

Build the **Add row / Edit row** modal (prototype language: `Modal` width ~580, `Field`-per-row, `.seg` kind toggles, Cancel + "Add row"/"Save" footer; in the platform that is `packages/ui` `FormModal` / `BaseModal` + the existing form primitives). Wire it to the stubs:

- **Add row:** `schema-row-list.tsx` — the `disabled` "+ Add row" `Button` (has `data-schema-id`). Open the modal with the parent `schemaId`.
- **Edit row:** `schema-row-card.tsx` — the `disabled` Edit `IconButton` (tooltip "Edit row (coming in W4-editor)"). Open the modal seeded from the row.

Field order (per §2 — language from the prototype, shape from the contract):

1. **Exercise** — REUSE the existing `apps/platform/.../components/exercise-picker.tsx` (`ExercisePicker`: MUI Autocomplete over `useExercises()`, search by name/family/modality, `placeholderOnly` filter, equipment/movement meta). Required. The nature (concrete / placeholder slot / rest) is whatever exercise the coach picks — no kind picker. Below it, show the picked exercise's equipment / movement / 1RM-ref chips (read-only, like the prototype).
2. **Sets** (optional int — "repeat THIS row N times in a row"; D6). A short number field + a one-line hint. Distinct from `reps` (count of the movement) and from the schema's `repetition.count` (cycles the row LIST).
3. **Reps** — the `RepsField` `.seg` [Count / Range / Time·dist / Max] + a clear-to-null button. `null` = inherit (don't store "implicit").
4. **Load** — the `LoadEditor` `.seg` [Absolute / % 1RM / Bodyweight / By profile] per §2 (count toggle, byProfile list, percentage reference, no None).
5. **Side** — select [— / Each arm / Each leg / Alternating / Left / Right] + an optional per-limb count for each_arm/each_leg.
6. **Tempo** — a 4-digit text input `3-1-X-0` parsed to the four positions (X allowed); empty → `null`.
7. **Modifiers** — the picker (D2).
8. **Demo** — a URL field (+ optional label) → `media`.
9. **Notes** — the NotesListEditor (D5).

**Write path EXISTS — reuse it:** `apps/platform/.../lib/hooks/use-schema-rows.ts` (`useCreateSchemaRow` / `useUpdateSchemaRow`) + `api.schemaRows.{create,update}` already forward the full `createSchemaRowSchema` incl. `modifierIds[]`. You build the FORM; the mutation is done.

### D2 — the modifier picker (searchable + create-on-the-fly)

A **reusable creatable multi-picker** (D-MODIFIER: "searchable create-on-the-fly picker, component shared with LABEL-FLOW-UX"). UX: a MUI Autocomplete (multi, `freeSolo`-style) over `api.modifiers.search(q)`; selected modifiers render as removable chips (the `BlockLabel` chip idiom); when the typed query has no exact match, a **"Create «query»"** option mints a new modifier (D3) and adds its id. Stores → `modifierIds: string[]` on the row (ordered; ≤20). Read embed = `modifiers: ModifierRef[]`.

- Base patterns to reuse: `packages/ui` `MultiSelect` (autocomplete + chips + search input) and the `freeSolo` autocomplete idiom in `apps/admin/.../classification-card.tsx`. The existing `LabelPickerChip` is the sibling for the chip look.
- A **search hook** does not exist yet — add `useModifierSearch(q)` (TanStack Query, `platformKeys.modifiers.search(q)` already in `keys.ts`) over the existing `api.modifiers.search`.
- Build it generic enough that LABEL-FLOW-UX can consume the same component later (don't wire the label surfaces this wave — keep scope tight).

### D3 — the coach modifier-create endpoint (the one api-server touch — W4-COACH-MODIFIER)

The platform modifier API is **search-only** (`lmsModifierPlatformApi.list`, `withCoachAuth`); create is admin-only (`cmsModifierAdminApi.createModifier`, `withAdminAuth`). Create-on-the-fly needs a coach create path. Add a **thin platform endpoint**, mirroring the admin one:

- `packages/api-server/.../endpoints/lms/modifier/platform.ts` — add `create(userId, data)`: `requireCoachLikeRole(userId)`, then the SAME body as `cmsModifierAdminApi.createModifier` (`nameLower`, `marshalNullableJson(notes)`, the `P2002 → ConflictError("Modifier with this name already exists", {field:"name"})`).
- Route: `apps/platform/src/app/api/platform/modifiers/route.ts` — `POST` wrapped with the coach auth factory, body `createModifierRequestSchema`, response `modifierSchema`.
- Client: `apps/platform/.../lib/api/endpoints/modifiers.ts` — add `create(data) → POST /api/platform/modifiers`.
- Hook: `useCreateModifier()` — on success, invalidate `platformKeys.modifiers.search`.

**NO Prisma / seed / contract-shape change** — the `Modifier` entity + `createModifierSchema` already exist (W4-model). So **no reseed.** This crosses the platform-only boundary by exactly one endpoint; its verification is the owner's gated api-server suite at merge (§7) — write the endpoint test, the owner runs the suite.

### D4 — the row-group box + grouping gesture (mirror schema-group, one floor down)

The row-group is the mirror of the schema-group inside the schema card. **Create wraps EXISTING contiguous rows** (DR-W4-RG-CREATE — not "author new", unlike schema-groups).

- **Box render** — extend `apps/platform/.../components/row-group-box.tsx` (today: frame + an overline label from `group.notes[0]` + member `SchemaRowCard`s). Add, mirroring `schema-group-box.tsx`: an **inline label edit** (`InlineEditText` on `group.notes[0]`, the opaque coach label e.g. "OR" / "+"), an **Ungroup** action (dissolve, keep rows) and a **Delete group + rows** action — both via the **house pending-modal pattern** (DR-W3-12: `ConfirmationModal` stays open until settle, `isConfirming` drives the disabled Processing… button). Frame colors via palette/`alpha` (no hex — DR-W3-2 mapping). The member rows already render via `SchemaRowCard`.
- **Create gesture** — the prototype's block-level select-mode (`cards.jsx` `BlockCard`: a "Group schemas…" affordance → checkboxes on items → bottom bar "N selected" + Cancel + "Group …"), applied at the **row floor**: a **"Group rows…"** `PlusRowButton` in the schema (shown when ≥2 _ungrouped_ rows), → checkboxes on rows → bottom bar Cancel + "Group rows" (disabled <2) → POST `/row-groups` `{schemaId, rowIds}`. **Guard (W4R-001):** rows already in a group are NOT selectable (filtered/disabled) so create never silently re-homes a row or orphans a group. **Contiguity (DR-W2-9 is server-enforced) but select-mode can pick a non-contiguous set** → validate the run is contiguous-by-`order` **client-side up-front** and surface a coach-friendly message (the DR-W1-5 parity precedent), don't let the raw server `BadRequest` leak.
- **Hooks to ADD** (client API `api.rowGroups.{create,update,delete}` EXISTS; hooks do NOT): `useCreateRowGroup`, `useUpdateRowGroup` (label/notes), `useDeleteRowGroup` (= ungroup, SetNull keeps rows), and a `useDeleteRowGroupWithMembers` (client-orchestrated sequential `DELETE /schema-rows/{id}` over members, with the `isRunningRef` re-entry guard — mirror `use-delete-group-with-members.ts`). All invalidate the week query.
- **Membership is create-only** (verified: `createSchemaRowSchema`/`updateSchemaRowSchema` reject `rowGroupId` — there is NO "add a row into an existing group" path). The v1 gesture set is therefore **wrap / ungroup / delete-with-rows / edit-label**. "Add to an existing group" is OUT (it would need a contract change) — confirm at Gate A (rec: defer; the coach adds all rows first, then wraps; to extend a group he ungroups + regroups).

### D5 — the notes multi-list editor (W4R-005)

`notes` is `string[]` (≤50 × ≤2000) on every carrier; today the row renders the list but the editor can't author it, and the helper `apps/platform/.../lib/notes-list-text.ts` is asymmetric (`textToNotesList` returns `[text]`, never splits — a multi-note round-trip collapses to one).

- Build a reusable **`NotesListEditor`** — renders the `string[]` as add/remove rows of short text (optional reorder), capped at `NOTES_MAX_COUNT` / `NOTE_MAX_LENGTH`, editing `string[]` **directly**. This **retires the buggy text helper** (no string⇄list conversion).
- Wire it into the **row modal** (mandatory). Also adopt it for the **schema / block / group inline notes** (D-PLAQUE: notes on any element) — the same component replaces the single-field `InlineEditText` note there. Confirm the breadth at Gate A (row modal is mandatory; the inline adoption is the same component at low marginal cost — rec: include).

### D6 — `sets` / `count` authoring

- `sets` — the Sets field in the row form (D1 step 2). `int?`, "repeat this row N times".
- `count` — the [1× | 2×] toggle inside `load.absolute` (D1 step 4 / §2). Both already RENDER ("×3", "2× 65 kg"); this wave makes them authorable.

### D7 — W4-HEADER-PARITY (D-HEADER-KEEP)

An in-group schema currently hides its header: `schema-card-head.tsx` renders the title row only when `!isBoxed`. **Render the header for in-group schemas like a standalone one** (the prototype shows it in both). No model change — a render-parity fix in the schema card head. (This is the only schema-chrome touch the wave makes; everything else schema-and-up is W3-done.)

---

## 4. Hard red lines (must NOT change)

1. **`buildRowItems` is the SOLE row-floor clustering predicate** (`packages/contracts/.../row-group/row-items.ts`, consumed ONLY by `schema-row-list.tsx`). Never hand-roll a row-cluster/child-count check — that class is how the last CRITICAL shipped. (Mirror: `buildBlockItems` at the schema floor.)
2. **No hex literals** anywhere (memory + house rule). Map the prototype's `--accent` / tints to MUI `palette` slots + `alpha(...)` per the W3 mapping (DR-W3-2: `#E07B35`→`primary.main`, frame border `alpha(primary.main,0.35)`, bg `0.03`, rail `0.45`, head-border `0.25`). Domain colors via `palette.kind.*`, never `tags.*`.
3. **Intensity is SCHEMA-ONLY** (D-FLOORS). The row form has NO intensity field. Do not re-add a row-level intensity override.
4. **Do NOT rebuild W3 / W4-model surfaces:** the schema-group box + its gestures, the `AxisEditorModal` (composition/rest/schema-intensity), `buildBlockItems`, the contracts, Prisma, the seed. The two new entities already exist. The ONLY api-server touch is D3 (a new platform endpoint, no schema/data change).
5. **Row-group membership is set ONLY via the row-group route** — do not add `rowGroupId` to the row create/update payload (a contract test pins its absence).
6. **House pending-modal pattern (DR-W3-12)** for every confirm (ungroup / delete-group / delete-row): dialog stays open until settle, `isConfirming` drives the disabled button; **synchronous re-entry guard (`isRunningRef`/`isFiredRef`, DR-W3-REENTRY)** on every modal-less gesture button (Group rows, Add row).
7. **`pointerFirstCollision` for any mixed-height sortable list** (DR-W3-11). The row list is uniform-height today; if you introduce a row↔row-group mixed-height DnD, use the composite. (Row reordering already exists; don't regress it.)
8. **One component per file**; reuse `@repo/ui` primitives + the existing `ExercisePicker` / `MultiSelect` / `LabelPickerChip` / `ConfirmationModal` / `FormModal` / `InlineEditText` / `PlusRowButton` — don't reinvent. Match the existing plan-detail spacing/idiom.
9. **No execution/scoring fields** (D-EXEC-DEFER): "for time" / "not for score" / "straight into" are notes, never new typed fields.

---

## 5. Verify-then-spec (confirm in code before locking the design)

- **Modifier client/server:** `api.modifiers.search` + `platformKeys.modifiers.search` EXIST; client `create` and any `useModifier*` hook do NOT → you add D2's search hook + D3's create (client+server+route+hook). Quote `cmsModifierAdminApi.createModifier` and mirror it exactly (incl. the `ConflictError`).
- **Row-group client/hooks:** `api.rowGroups.{create,update,delete}` EXIST; NO hooks → add them (D4). Confirm the create response embeds `{ group, members }` (it does — render the box immediately).
- **Row write path:** `useCreateSchemaRow`/`useUpdateSchemaRow` + `modifierIds[]` EXIST and work → reuse, don't rebuild.
- **The stubs' exact sites:** the Add-row `Button` (`schema-row-list.tsx`) and the Edit `IconButton` (`schema-row-card.tsx`) — confirm and wire.
- **Header-parity site:** confirm `schema-card-head.tsx` gates the title on `!isBoxed`; that's the parity fix.
- **`ExercisePicker` reuse:** confirm props (`value`/`onChange`/`placeholderOnly`/`compact`) fit the row form + the percentage "other exercise" reference.
- **Contiguity in select-mode:** confirm `assertRowGroupMembersContiguous` is server-side and decide the client-side up-front validation message (DR-W1-5 parity).
- **"Add to existing group":** confirm there is no contract path (createSchemaRow rejects `rowGroupId`); lock the v1 gesture set to wrap/ungroup/delete/edit-label (Gate A: defer add-to-existing).
- **NotesListEditor breadth:** confirm whether the inline schema/block/group notes adopt it this wave (rec: yes — same component).

---

## 6. Acceptance — the owner's literal walkthrough (browser; jsdom is BLIND to the DnD/pointer/modal layer)

The platform suite is the floor, not the gate — the gate is the owner driving the real app (W3 proved jsdom misses the interaction layer). Numbered script the owner will run:

1. **Add a row:** open Add row on a schema → pick an exercise (search works) → see its equipment/movement chips → set Reps (Count, then switch to Range, then Max) → Save → the row renders with the right sub-parts.
2. **Load, every kind:** edit the row → Absolute [2×] + kg → save → renders "2× N kg"; switch to % 1RM (value + Max% + "Other exercise" → picker) → renders "%"; Bodyweight → "BW"; By profile → add two `(label, kg)` entries → renders both.
3. **Side / Tempo / Sets:** set Side "Each leg" (+ per-limb count), Tempo `3-1-X-0`, Sets 3 → all render.
4. **Modifiers + create-on-the-fly:** open the modifier picker → search an existing one → add it (chip); type a NEW name not in the catalog → "Create «…»" → it persists and attaches; reload → it's still there (a real library entry, reusable on another row).
5. **Notes multi-list:** add 2–3 notes on the row → all render as the stack; reopen the editor → still a multi-note list (not collapsed to one).
6. **Group rows:** "Group rows…" → select 2 contiguous rows → "Group rows" → a row-group box appears with the members; set its label "OR". Try selecting a non-contiguous pair → a coach-friendly message, no raw server error. Confirm an already-grouped row can't be re-selected into a new group.
7. **Ungroup / delete:** ungroup → rows survive as standalone; delete-group-with-rows → rows gone, box gone (the modal shows Processing… and stays open till done).
8. **Header parity:** a schema inside a group shows its header identically to a standalone schema.
9. **The evil-fixture build (the real gate):** the owner builds the maximally-evil CrossFit workout (blocks A–F: waves, EMOM with rest-slot, parallel inner-ladders, intervals, compound minute, split-tier, OR cash-out, "from sofa" modifiers, placeholder slot) by hand in the UI — every shape must be expressible and read back unambiguously.

---

## 7. Verify commands

- Root, every iteration: `pnpm check-types && pnpm lint` (must be green before review).
- Platform tests **only** via: `SKIP_ENV_VALIDATION=1 pnpm exec vitest run --project platform` (`pnpm --filter platform test` silently no-ops — false green).
- `pnpm dep:check` if you add/cross package imports.
- **NEVER** run the root `pnpm test` / `task test` / `turbo test`, and **NEVER** an `@repo/api-server` test run — both are owner-gated.
- **D3 is the api-server touch:** write the platform create endpoint + its test, but state the gate as the **OWNER's manual ritual** — the gated api-server suite at merge (`pnpm --filter @repo/api-server test`, ~10 min, serial, live Neon). **No `db:reset`/`db:seed` needed** (D3 adds an endpoint, no schema/data change). Everything else is platform-only.

---

## 8. Process

- Branch: `feat/session-primitive-w4-editor`. Conventional **lowercase** commits (subject ≤ the commitlint cap; body ≤150/line), **no AI trailers / Co-Authored-By**, **never `--no-verify`** (pre-commit = check-secrets + lint-staged; cone check-types is pre-push — intermediate type-RED commits are fine, only the final pushed tree must be green).
- Full `/feature` pipeline; surface every real fork at **Gate A** with a recommendation (the orchestrator pre-resolved F1=include create-on-the-fly, F2=NotesListEditor+retire helper, F3=select-mode+reject-already-grouped — re-open only with a contentful counter).
- **Close-out docs land IN THE SAME PR** (promote the W4-editor DRs into `decisions.md`, close `W4R-001`/`W4R-005`/`W4-COACH-MODIFIER`/`W4-HEADER-PARITY` in `deferred.md`, update `state.md`/`journal.md`/`plan.md` — one docs commit in the feature PR, never a separate post-merge commit).
- One `/feature` run this session (house budget).
- The orchestrator reviews via **git diff**, not your self-report. Report what you actually changed, what you skipped, and any fork you resolved differently — with the reason.
