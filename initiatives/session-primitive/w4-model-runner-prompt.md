# W4-model — runner prompt (session-primitive)

> Transport this whole file into a fresh `/feature` (full) session. The runner has NONE of the design-session context — everything needed is here. This is the **model** half of W4 (the data layer); the authoring-UX rebuild is the separate W4-editor wave after it.

---

## §0 Context

You are building **W4-model** of the `session-primitive` initiative — the data-layer reshape that lands the ratified row grammar. **Read first, in order:** `initiatives/session-primitive/charter.md` · `decisions.md` (especially **D-FLOORS, D-ROW-GRAMMAR, D-LOAD-FINAL, D-TEMPO, D-MODIFIER, D-PLAQUE, D-HEADER-KEEP, D-EXEC-DEFER**, plus the W2 calls DR-W2-1/2/9 and FORK-6 you will mirror) · `primitive-spec.md` (the FROZEN grid — §3/§4/§5 + the row formula + §6 kill list) · `plan.md` §W4.

**LIVE law of main (what exists now):** ADR-0041 is the model — `SchemaGroup` is a real block-owned entity (membership via `Schema.groupId` SetNull, no order column, position = `min(member.order)`, contiguity enforced server-side by `assertGroupMembersContiguous`, clustered by the ONE shared `buildBlockItems(schemas, groups)` in contracts). The W3 editor renders off `buildBlockItems`. Row payload today is a `discriminatedUnion("rowKind", …)` over `EXERCISE | REST | PLACEHOLDER | REST_SLOT` with 9 modifier columns (`load/reps/side/tempo/position/sequence/intensity/media/notes`). This is the `db:reset` world — **no migrations**, aggressive bridge-free (intermediate RED trees fine; only the final pushed state must be green).

**What this wave changes:** the row grammar collapses to ONE authored kind (exercise), two NEW entities appear (a row-MODIFIER library + a ROW-GROUP), the leaf modifiers slim, per-floor settings relocate, and notes become an ordered multi-list. Mirror the proven W2 patterns — do NOT invent new shapes where a Label/SchemaGroup analogue exists.

---

## §1 Deliverables (numbered; surfaces named where known — corrections welcome at Gate A)

**1. Row-MODIFIER library (new catalog entity — mirror `Label`).** A coach-owned dictionary of "how to execute" terms (`from sofa`, `neutral grip`, `without jump`, `to parallel`, `2 sec pause in up`, `slow eccentric`, …). Mirror the `Label` + `BlockLabelAssignment` pattern verbatim:

- Prisma `Modifier` { id, name, nameLower @unique, notes?, timestamps } + a join `RowModifierAssignment` { rowId, modifierId, order; `onDelete: Restrict` on modifier (delete-in-use refused — the `BlockLabelAssignment`→Label precedent), Cascade from row; `@@unique([rowId, modifierId])`, `@@index` }.
- Contracts: a `modifier` entity module (schema + types) mirroring `label`; row gains `modifiers: ModifierRef[]` in the read embed.
- Endpoints: CRUD mirroring the Label/Exercise admin + list endpoints (so the W4-editor picker can search + create-on-the-fly).
- **KILL `position` end-to-end:** `Position` enum (`schema.prisma`), `SchemaRow.position` column, `positionSchema`/`POSITIONS` (contracts `schema-row`), `position-editor.tsx`, `formatPosition` + its call in `format-row-builders.ts`. **Seed:** every `position` value → a `Modifier` entry + a row assignment (one entry per distinct string; merge the word-order dupes per D-MODIFIER).

**2. Row-GROUP (new entity — mirror `SchemaGroup` one floor down).** The box for related rows (OR / superset / per-set / the ex-compound). Mirror `SchemaGroup` verbatim:

- Prisma `RowGroup` { id, schemaId, timestamps, notes via the multi-note model of deliverable 8 } schema-owned `onDelete: Cascade`; members via `SchemaRow.rowGroupId` `onDelete: SetNull` (dissolve = non-destructive); **NO order column** (position = `min(member.order)`); `@@index([rowGroupId])` on row, `@@index([schemaId])` on RowGroup. **No `label` column** — the box label is the first note (D-FLOORS/D-PLAQUE).
- Contracts: `buildRowItems(rows, rowGroups): RowItem[]` — the EXACT mirror of `buildBlockItems` (the new one-predicate; `RowItem = { kind:"row"; row } | { kind:"group"; group; members }`), the SOLE clustering source. Contiguity invariant `assertRowGroupMembersContiguous` mirroring `assertGroupMembersContiguous`, enforced server-side on create/create-into/reorder.
- Endpoints: row-group create / update(notes) / delete mirroring the `/groups` routes (delete dissolves; last-member-delete auto-removes the empty group).

**3. Exercise-form → atomic-only.** Kill `compound` / `or_alternative` / `placeholder_ref` from `exerciseFormSchema` (`_shared/compounds.ts`); `atomic` is the only surviving form. **Seed:** every compound `+` row and every `OR` row → a ROW-GROUP of member rows (each element its own atomic row with its own reps/load/side); the group's first note carries the connector text where meaningful ("OR"). `pairedConcreteRowId` already dead (DR-W2-5).

**4. Load reshape (D-LOAD-FINAL).** `load` variants → `absolute { count: 1|2, kg }` · `percentage { value, reference: "self" | { exerciseId } }` · `bodyweight` · `byProfile { entries: { label, kg }[] }`. KILL: `none` (= bodyweight), the `percentage` `family` reference, `byProfile {first,second}` → the label-list. **Weight VO dies:** `single`+`single_arm` merge (one-arm → `side`); `split_tier` → a row-group (deliverable 2); `with_asymmetric_arm`/`with_depth_modifier` → `single` + a MODIFIER ref (deliverable 1); `compound_device` equipment list drops `BOX`/`SOFA`/`BOX_OR_SOFA`. The `count` lives on the row (NOT derived); the implement TYPE rides the exercise (the later equipment-library pass — out of scope here). Reshape seed + mapper.

**5. Tempo slim (D-TEMPO).** `tempoModifierSchema` → `fullTempo` only; each position is `int | "X"` (explosive). KILL the verbal forms (`pauseInUp`/`perNthRepPause`/`slowEccentric`/`holdAfterLast`). **Seed:** the verbal-tempo rows → MODIFIER refs (deliverable 1).

**6. RowKind collapse (D-ROW-GRAMMAR + D-PLAQUE).** The authored row is always `EXERCISE`. KILL `RowKind.REST` (+ its `raw`), `REST_SLOT`, `PLACEHOLDER` as authored kinds. **Bridges in seed (the full nature enum is the later catalog pass — do NOT build it here):** between-sets/rounds REST rows → the **schema rest setting** (`composition.rest` — the existing carrier; the row vanishes); the dual-rest corpus schema's 2nd rule → a schema note; the EMOM minute REST_SLOT → an `EXERCISE` row pointing to a **seed Rest-natured exercise** (add one; reuse the existing `placeholderFlag` mechanism as the interim nature carrier); the PLACEHOLDER slot rows → `EXERCISE` rows pointing to `placeholderFlag` exercises (already supported). `ROW_KINDS` reduces accordingly (keep an inferred render discriminator if the render needs it, but it is NOT an authored choice).

**7. `sets` on the row.** Add `sets?: number` (the count of consecutive repeats of THIS row) — a free row property, NO schema-awareness, NO "only without repetition" guard (D-ROW-GRAMMAR).

**8. D-FLOORS settings relocation + notes multi-list.**

- Block loses `intensity` + `timeCap` columns → intensity moves to the SCHEMA (the sole intensity carrier; remove the row-level intensity override too); the block's timeCap re-expresses as a schema `repetition.timeCap`. **Seed:** block-055 `70% EFFORT` → schema intensity; `PRACTICE [5-10 min]` → a `timeCap` schema.
- `SchemaGroup.label` column → notes (first note).
- The single `notes` text column on **block / schema / row / SchemaGroup / RowGroup** becomes an **ordered list of short texts** (mirror one consistent shape — e.g. a `notes Json` array, or a small `Note` join; choose at Gate A, justify). `[ EXAMPLE: … ]`, the `sequence`-prose remainder, the "= 1 rep" framing, the MAX tails all re-express as notes. KILL the `sequence` VO + column; the only-once corpus row re-expresses as its OWN schema placed before the metcon (seed).

**9. Minimal platform (compile + render, NOT the proto rebuild).** Make `apps/platform` typecheck + render off the reshaped contracts — dead-but-functional UX (the W2→W3 split: W2 re-pointed minimally, W3 rebuilt). The modifier picker, the row-group box, the sets/count fields, the row-form rebuild are **W4-editor**, NOT here. Where a killed surface leaves an editor hole, stub it minimally (a plain read render) — do not build new UX.

---

## §2 Hard red lines (do NOT cross)

- **Charter-sacred, untouched:** the `repetition` 6 kinds (once/count/ladder/timeCap/cadence/interval) + the `rest` axis. The Plan→Week→Day floors + plan-as-train.
- **Do NOT build the full catalog nature enum** (`concrete|placeholder|rest`) or the equipment library — those are the SEPARATE catalog pass (CATALOG-NATURE / EQUIPMENT-LIBRARY in `deferred.md`). Bridge REST/PLACEHOLDER via the existing `placeholderFlag` + a seed Rest exercise. The `count` lives on the row; the implement type stays on the exercise as-is.
- **Do NOT add any execution/scoring field** (D-EXEC-DEFER) — "straight into", "for time", "score on rounds 2&3", "not for score", effort qualifiers are NOTES. No `continuous` boolean.
- **One-predicate rule:** `buildRowItems` is the SOLE row-clustering source (mirror `buildBlockItems`; red line #4 of W2). No hand-rolled cluster loop, ZERO second consumer of clustering logic.
- **Sweep the raw-SQL layer** (`prisma/sql/` + `scripts/`) — the W2 trap (DR-W2-8): `lms-checks.sql` partial uniques referenced a killed column and broke `db:reset` live; tsc/vitest/`.ts`-greps are ALL blind to `.sql`. Any constraint referencing a killed column (`position`, the dropped block columns, `SchemaGroup.label`) must be updated or dropped.
- **Header stays** (D-HEADER-KEEP) — `Schema.header` is untouched.
- Aggressive bridge-free, but the FINAL pushed state is green on every runnable gate.

---

## §3 Verify-then-spec (confirm in code BEFORE locking the design at Gate A)

1. **Mirror targets — read verbatim:** `Label` + `BlockLabelAssignment` (deliverable 1's pattern), `SchemaGroup` + `buildBlockItems` + `assertGroupMembersContiguous` + the `/groups` routes (deliverable 2's pattern), the `Label`/`Exercise` admin+list endpoints (deliverable 1's CRUD).
2. **Re-express targets — enumerate every seed producer** of: `position`, weight exotics (`split_tier`/`with_asymmetric_arm`/`with_depth_modifier`/`single_arm`), verbal `tempo`, `RowKind` REST/REST_SLOT/PLACEHOLDER, compound/OR rows, block `intensity`/`timeCap`, `SchemaGroup.label`, `load.none`/`byProfile`. Each needs a re-expression call.
3. **Every consumer of every killed surface** across `contracts` / `api-server` (mappers, guards, endpoints) / `apps/platform` — `positionSchema`, the weight exotic variants, the verbal tempo fields, the dead RowKinds, the block columns, `sequence`. Trace before deleting (the DR-W2-5 "verify the premise" discipline).
4. **`prisma/sql/lms-checks.sql` + `apply-sql-checks.ts`** — any partial unique / check referencing a killed column.
5. **Notes shape** (deliverable 8) — pick the multi-note representation and justify (Json array vs join) against how block/schema/row/both-groups all need it uniformly.

Corrections to the deliverables are EXPECTED here — the design stage is where a mis-located surface gets fixed (W1/W2 both corrected the prompt at this stage).

---

## §4 Acceptance (the owner's literal walkthrough)

1. `pnpm db:reset` + `pnpm db:seed` succeed (the raw-SQL layer included — no dead-column constraint).
2. The platform week view GETs + round-trips off the reshaped contracts (renders; ugly is fine — proto is W4-editor).
3. The seed expresses the evil-fixture shapes (journal A–E): a compound → a row-group; an OR → a row-group; a split-tier → a row-group; position/tempo-verbal → modifier refs; a rest row → the schema rest setting; an EMOM REST minute → a Rest-exercise row; block intensity/timeCap → schema.
4. The gated api-server suite is green (the OWNER's manual ritual — see §5).
5. `primitive-spec.md` stays frozen (zero OPEN); no execution/scoring field appeared.

## §5 Exact verify commands

- Types + lint (root): `pnpm check-types && pnpm lint`.
- Platform tests ONLY via: `SKIP_ENV_VALIDATION=1 pnpm exec vitest run --project platform` (`pnpm --filter platform test` silently no-ops — false green).
- Contracts: `pnpm --filter @repo/contracts test`.
- **NEVER** the root `pnpm test`. The **api-server suite is the OWNER's manual gated ritual** (~10 min, live Neon): `pnpm db:reset && pnpm db:seed && pnpm --filter @repo/api-server test` — state it as a PENDING owner step in the close-out; do not run it in the pipeline.

## §6 Process

- Branch `feat/session-primitive-w4-model`. Conventional lowercase commits, **no AI trailers**, never `--no-verify`/skip flags (fix root causes; for husky cross-package intermediate breakage, squash the atomic prompt-defined steps).
- Full `/feature` pipeline; surface the real forks at Gate A (the notes-shape choice, the modifier assignment shape, any mis-located surface). **If Gate A judges the wave too large, split at the pre-identified seam:** A1 = the two new entities (+ their seed/api), A2 = the leaf reshape + floors — and run only A1 this session.
- Close-out docs promoted INTO the same PR (DR/carry-forwards → the initiative; this is the Definition of Done — `docs/process.md`).
- **ONE full `/feature` run this session** (house budget).
