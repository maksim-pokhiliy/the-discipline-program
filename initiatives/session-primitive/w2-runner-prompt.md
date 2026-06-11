# W2 runner prompt — session-primitive model core (Group entity; recursion/arrangement death; ratified leaf kills)

> Transport note (owner): paste this whole document as the argument of a `/feature` (full) run in a FRESH session. One full run, nothing else in that session.

## 1. Context

You are implementing **Wave 2 (model core)** of the `session-primitive` initiative. Read FIRST, in this order:

1. `initiatives/session-primitive/charter.md` — goal, scope, sacred list.
2. `initiatives/session-primitive/decisions.md` — D-1..D-8, **D-MARKER-DEATH (RATIFIED)**, DR-W1-1..5.
3. `initiatives/session-primitive/primitive-spec.md` — §1 skeleton, §3–5 grids (per-notation verdicts), §6 kill list, §8 re-expressions.
4. `initiatives/session-primitive/plan.md` — §W2 and the wave boundaries (what is W3/W4, i.e. NOT yours).
5. `initiatives/session-primitive/deferred.md` — the W2 obligations: W1-DUP-RETRY, W1-RENDER-REPOINT, W1-SUBADD-BOX.

**The live law of main today (ADR-0040, what you are replacing):** parallelism is DERIVED — `isStructurallyParallel(composition, { containerChildCount })` in `packages/contracts/src/entities/lms/composition/composition-label.ts:38` (childCount ≥ 2 && repetition absent-or-`once` && arrangement absent). Sub-schemas nest via `Schema.parentSchemaId` (Prisma self-relation, recursive `SchemaWithBody.subSchemas`). The atomic batch create is `POST …/schemas/parallel` (parent + N ladder children). W1 (PR #261, merged) re-skinned this into a box UX (`AccentGroupCard` in `schema-group-box.tsx`, label = parent `header`, «Group into one box» checkbox) WITHOUT touching the model.

**What W2 does:** the box becomes REAL — a persisted `SchemaGroup` entity owns membership; recursion (`parentSchemaId`) dies; the composition `arrangement` axis dies whole; the ratified leaf kills land; seed re-expresses; guards re-derive. After W2 the stored model is exactly the ratified skeleton:

```
Session → Block → [Group?] → Schema → Row        (fixed floors, NO recursion)
```

**Binding decisions (do not re-litigate; quote-level constraints):**

- **D-2 BOX:** a relation between siblings = membership in an explicit Group: ordered, CONTIGUOUS members + optional free-text label the system carries but NEVER interprets. No sibling→sibling references. NO semantics derived from child count. Owner verbatim: "сиблинги не должны знать о 'связях' между собой. связывает блок… 'связь' это исключительно представление и структура, потому как связать мы можем только элементы идущие подряд."
- **D-3 NO-RECURSION:** `parentSchemaId` dies; no group-in-group; max structural depth = Block → Group → Schema → Row.
- **D-4 NO-TYPED-REL:** no relation-kind enum anywhere — not on Group, not in render special-cases that get stored.
- **D-5 CHANNELS:** every notation maps to exactly one of: structure | typed field (only what a machine reads) | human text | dropped syntax.
- **D-MARKER-DEATH (RATIFIED 2026-06-11):** `INNER_LADDER_MARKER` row kind dies. Per-track rep-scheme = N one-row ladder-schemas in a Group; shared round-counter = one ladder-schema with N rows. The semantic distinction survives as two STRUCTURES. The forbidden-fusion superRefine and its bug class die as unrepresentable.
- **D-6 owner bars (verbatim, final):** `[ TOTAL ]` is dead entirely ("даже не думай об этом"); footnote `*`/`**` roles 2–4 = a plain exercise row placed LAST ("поставь его в конец"); per-set substitution = row-level grouping, no typed mapping ("уникальности ноль").
- **DR-W1-2:** «Group into one box» checkbox stays a submit-branch flag; the unchecked path stays N independent non-atomic creates BY DESIGN (now with idempotency, §D5).

## 2. Target model

### Prisma (db:reset world — NO migrations dir exists and none may be created; schema edits land via `pnpm --filter @repo/api-server db:reset` which the OWNER runs)

```prisma
model SchemaGroup {
  id              String   @id @default(cuid())
  blockId         String
  label           String?
  interleaveOrder String   @default("round_by_round")   // or a Prisma enum — match house style; values: round_by_round | track_by_track
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  block   Block    @relation(fields: [blockId], references: [id], onDelete: Cascade)
  members Schema[]

  @@index([blockId])
  @@map("training_schema_groups")
}
```

- `Schema`: REMOVE `parentSchemaId`, the `SchemaSubSchemas` self-relation (both sides), `@@unique([parentSchemaId, order])`, `@@index([parentSchemaId, order])`. ADD `groupId String?` + relation to `SchemaGroup` with **`onDelete: SetNull`** (deleting a group dissolves it — members survive as plain block-level schemas) + `@@index([groupId])`. Everything else (blockId, order, header, composition, intensity, notes) stays.
- **Consciously NOT added: `@@unique([blockId, order])`.** Today's top-level schemas have no DB-enforced order uniqueness either (the old unique keyed on nullable `parentSchemaId` — Postgres NULLs never collide), so this is no regression; adding it would force a two-phase reorder rewrite that belongs to W3's editor/reorder rebuild. Recorded as a deferred obligation (W2-ORDER-UNIQUE → W3). Do not add it.
- `SchemaRow`: REMOVE the `compoundRep` column. `RowKind` enum → exactly `EXERCISE | REST | PLACEHOLDER | REST_SLOT`. Columns `position` (enum), `sequence`, `tempo`, `media`, `reps`, `load`, `side`, `intensity`, `notes` all STAY as columns (some Json shapes change, §D4).
- Group position among block items is DERIVED from its members' contiguous `order` run (min of member orders). A Group has NO own `order` column — membership is the only link (D-2).

### Composition contract (target)

```ts
// packages/contracts/.../composition.schema.ts
export const compositionSchema = z
  .object({
    repetition: repetitionAxisSchema.optional(), // 6 kinds, SACRED, untouched
    rest: restAxisSchema.optional(), // untouched
  })
  .strict();
```

- `arrangementAxisSchema`, `supersetPairSchema`, `interleaveOrder` (top-level field), `ARRANGEMENT_AXIS_KINDS` — die. `PARALLEL_INTERLEAVE_ORDERS` + `DEFAULT_INTERLEAVE_ORDER` MOVE to the new schema-group module (values unchanged: `round_by_round | track_by_track`).
- `composition-label.ts`: `isStructurallyParallel` + `CompositionStructure` are DELETED. `deriveKind` loses the structure param and the `parallel`/`superset` branches; `COMPOSITION_LABEL_KINDS`/`COMPOSITION_LABEL_FAMILIES` lose `parallel`/`superset` / `PARALLEL`/`SUPERSET`. Label derivation becomes a pure function of `composition.repetition`.
- Compose-projection contracts (`composeRowSchema`/`composeContainerSchema`/`composeNodeSchema`): recursion dies — a container's children are ROWS only (no nested containers); the ladder+marker `superRefine` (composition.schema.ts:128–144) dies with the marker.

### Group contract (new module, mirror the `schema-row` module layout)

`packages/contracts/src/entities/lms/schema-group/` with `schema-group.schema.ts`, `schema-group-api.schema.ts`, types/constants/index. Register the subpath export exactly the way the sibling lms modules are registered (read `packages/contracts/package.json` exports + the lms barrels verbatim BEFORE editing).

```ts
export const schemaGroupSchema = z.object({
  id: z.string().cuid(),
  blockId: z.string().cuid(),
  label: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable(),
  interleaveOrder: z.enum(PARALLEL_INTERLEAVE_ORDERS),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createGroupRequestSchema = z.object({
  blockId: z.string().cuid(),
  label: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable().optional(),
  interleaveOrder: z.enum(PARALLEL_INTERLEAVE_ORDERS).optional(),
  tracks: /* same per-track shape + bounds as today's createParallelSchemasRequestSchema:
            { header?, steps: int().positive().max(MAX_LADDER_STEP_VALUE) min 1 max MAX_LADDER_STEPS },
            min 2, max MAX_PARALLEL_TRACKS (reuse the existing SCHEMA_CONSTANTS) */
}).strict();
// response: { group: schemaGroupSchema, members: SchemaWithBody[] }
export const updateGroupRequestSchema = z.object({
  label: …nullable().optional(),
  interleaveOrder: z.enum(PARALLEL_INTERLEAVE_ORDERS).optional(),
}).strict();
```

**The new one-predicate (replaces `isStructurallyParallel` — same discipline, new source):** ship ONE shared clustering helper in contracts (suggested `buildBlockItems(schemas, groups)` → ordered `Array<{ kind: "schema"; schema } | { kind: "group"; group; members }>`, contiguity-aware). EVERY reader — platform render, any test asserting box-ness — consumes this helper or `schema.groupId` directly. A hand-rolled "cluster by groupId" loop in a component is the same disease the one-predicate rule exists to prevent (the last CRITICAL shipped exactly that way).

### Schema contract

- `SchemaShape`: `parentSchemaId` → gone; `groupId: string | null` added. `schemaSchema` no longer needs `z.lazy`.
- `SchemaWithBody` = `{ schema, rows }` — `subSchemas` dies everywhere.
- `createSchemaSchema`: drop `parentSchemaId`; add `groupId: z.string().cuid().nullable().optional()` (create-into-existing-group). `updateSchemaSchema`: `blockId`/`groupId` are NOT updatable (membership changes are W3 gestures; keep the server's existing structural-immutability pattern).
- `reorderSchemasRequestSchema`: the blockId-XOR-parentSchemaId union collapses to `{ blockId, orderedIds }`.
- `createParallelSchemasRequestSchema`/`…ResponseSchema` die (replaced by the group create).

### Leaf contracts (Grid A/B ratified kills ONLY — the OPEN rows are red lines, §4)

- **reps** (`_shared/reps.ts`): union → `count | range | unit_bound | max`. `max` becomes `{ kind: "max", tail?: string }` — `MAX_SUB_FORMS`, `progressiveSeed`, `targetExerciseId` die (the 3 corpus sub-forms + progressive seeds are free-text tail). `implicit` dies — implicit reps = `reps: null`, the render resolves from the ladder context (storing "absence" was the disease). `total_flag` dies (TOTAL ruling). `compound_rep_unit` dies. `compoundRepDefinitionSchema` + `COMPOUND_REP_DEFINITION_FORMS` die (REP_DEFINITION kill).
- **load** (`_shared/load.ts`): kinds → `absolute | percentage | bodyweight | byProfile | none`. `byProfile` = `{ kind: "byProfile", first: z.number().positive(), second: z.number().positive() }` — the ex-`dual_value` m/f pair PROMOTED from weight-variant to load-kind; the inert `resolver: "athlete_profile"` literal is dropped (re-introduce with a real athlete-context engine, ADR-0038 principle). `without_weight` → `none` (explicit no-load, e.g. the EXPLODE drop-stage); `unspecified` → dies (= `null`). `percentage` (+reference scopes) and `bodyweight` untouched.
- **weight** (`_shared/weight.ts`): remove ONLY the `dual_value` variant (its semantics moved to `load.byProfile`). `single | dual | single_arm | compound_device | split_tier | with_asymmetric_arm | with_depth_modifier` ALL STAY — the exotics are an OPEN follow-up (F-WEIGHT-EXOTICS), not yours.
- **media** (`_shared/media.ts`): → `{ url, label? }`. `MEDIA_POSITIONS` / `MEDIA_APPLIES_TO` die — placement = which node carries the media.
- **schema-row**: `ROW_KINDS` → the 4 survivors; payload union drops the `FOOTNOTE`, `STANDALONE_LOAD`, `STANDALONE_URL`, `INNER_LADDER_MARKER`, `REP_DEFINITION` variants and their satellite schemas/constants (`FOOTNOTE_MARKERS`, `footnoteTargetSchema`, `footnoteContentSchema`, `URL_APPLIES_TO`, `urlAppliesToSchema`, `standaloneLoadScopeSchema`, the `wrapped` flag). `schemaRowSchema`/`create…`/`update…` drop `compoundRep`. `placeholderPayloadSchema.pairedConcreteRowId`: it is a sibling-ref (D-2 violation) serving footnote role-1 pairing — kill it IF verification (§5.4) confirms footnote role-1 artifacts are its only producers; otherwise STOP and surface. `perSetSubstitution*` STAYS (its kill rides W4's row-grouping carrier).
- **compounds** (`_shared/compounds.ts`): `cyclicalCompoundSchema`, `sandwichCompoundSchema` and their `exerciseFormSchema` variants + `EXERCISE_FORMS` entries die — `compoundRowSchema` (ordered `elements` ≥ 2, per-element reps/load/side, optional `sharedModifiers`) IS already the ratified ONE compound form, unchanged. `atomic`, `compound`, `or_alternative`, `placeholder_ref` stay (`or_alternative`'s death rides W4 with the plaque/row-grouping carrier — NOT yours). `footnoteContentSchema` dies with FOOTNOTE.

## 3. Deliverables (numbered; each names its primary surface)

**D1 — Prisma + contracts model core** as specced in §2. Surfaces: `packages/api-server/prisma/schema.prisma`; `packages/contracts/src/entities/lms/{composition,schema,schema-row,schema-group,_shared}/…` + barrels + package exports.

**D2 — api-server group endpoints + create/reorder rewrite.** Surfaces: `packages/api-server/src/endpoints/lms/schema/…` (+ a new `schema-group/` endpoint module matching siblings), the Next route handlers under `apps/platform/src/app/api/platform/training-plans/[planId]/…` (new `groups/` + `groups/[groupId]/` route dirs copying sibling route.ts style; the `schemas/parallel/` dir dies):

- `POST …/groups` — atomic: create `SchemaGroup` + N ladder member schemas appended at the block tail with contiguous orders. Replaces `POST …/schemas/parallel`; `materializeParallelTree` (`endpoints/lms/schema/create-steps.ts`) is rewritten into this. NO parent schema is created — the group + flat members ARE the structure.
- `PUT …/groups/{groupId}` — `{ label?, interleaveOrder? }`.
- `DELETE …/groups/{groupId}` — dissolution: delete the group row; the `SetNull` FK frees members in place (they remain plain block schemas). No member deletion.
- `POST …/schemas` — scope = `blockId`; optional `groupId` inserts the new schema at the END of that group's contiguous run, shifting later block orders in the same transaction (this is what the in-box "add" uses).
- `POST …/schemas/reorder` — `{ blockId, orderedIds }` over all the block's schemas.
- Schema delete: when the deleted schema was its group's LAST member, delete the (now empty) group in the same transaction.

**D3 — guards re-derived.** `assertArrangementRefsInScope` dies; the compose-tree write validation simplifies to flat container+rows; NEW server-side assertion: every group's members form a CONTIGUOUS `order` run within their block — enforced on group create, create-into-group, and reorder (reject non-contiguous arrangements with a coach-readable message).

**D4 — idempotency for the unchecked batch (W1-DUP-RETRY).** Use the EXISTING house layer — `packages/api-routes/src/idempotency/` (`wrapAuthHandler`, `Idempotency-Key` header, replay + body-fingerprint mismatch → 409). The store is already bootstrapped via `packages/api-server/src/instrumentation/bootstrap-backend-di.ts` (verify what port it registers, §5.2); NO route consumes the wrapper yet — `POST …/schemas` becomes the first. Client side: `useCreateIndependentLadders` sends a stable `Idempotency-Key` per (draft-session uuid, trackIndex) so a retry after partial failure replays instead of duplicating. Degradation when no store is registered = live run (today's behavior; acceptable dev posture — log line already exists). Pin the behavior: the deferred MT-19 test lands HERE as "same-key retry → replay, no duplicate row" (plus a unit test against the in-memory/test port if the module ships one).

**D5 — read surface.** Week/day GET embeds reshape: blocks gain `groups: SchemaGroup[]`; schemas come FLAT with `groupId` (no `subSchemas`); the subtree builders (`buildSchemaSubtree`, `buildSchemaForest`, `bucketByParent` in `packages/api-server/src/mappers/lms/schema.mapper.ts`) die; the derived `schema.label` computation drops the structure param (find its compute site, §5.1). Block contract gains the `groups` array.

**D6 — seed re-expression** (`packages/api-server/prisma/seed/plan-data/plan-synthetic/` + `plan-emit/`):

- Enumerate EVERY `parentSchemaId` producer in seed and re-express each by shape:
  - **Parallel parents** (4 expected; incl. block-037 in `week-1-saturday.ts` — 36-28-20 / 18-14-10 tracks) → `SchemaGroup{ label = ex-parent.header }` + the children as block-level members on contiguous orders. Before dissolving any parent, assert it carries NOTHING beyond `header` + empty/`once` composition — a parent with real `notes`/`intensity`/composition has no Group field to receive them: STOP and surface instead of silently dropping.
  - **Rounds-over-parallel depth-3** (the block-010 shape; locate via `sub-schema-coverage.ts`) → a Group whose LABEL carries the rounds text (e.g. "5 rounds:") — channel-3 per BACKLOG-ROUNDS; members = the ladder schemas.
  - **Cadence/EMOM parents with sub-schemas** (`week-1-tuesday.ts`, `week-2-friday.ts`) → slots-as-rows: ONE cadence schema whose sub-schema content flattens into `EXERCISE`/`REST_SLOT` rows (D-EMOM-SLOT predecessor ruling). NOT groups.
- `phase-7-superset-blocks.ts`: the superset arrangement + pairs die (0 corpus occurrences — Phase-7 speculation); keep the rows as plain ordered rows; the arrangement back-patch machinery (`schema-emit-back-patch.ts`, `stripArrangement` in `schema-emit.ts`) dies. All explicit `arrangement: { kind: "ordered" }` literals across seed vanish with the axis.
- Leaf re-expression, per §2 target shapes: `STANDALONE_URL` rows → `media{url, label?}` on the row/schema they demonstrate (`wrapped` dropped); `STANDALONE_LOAD` → its load written onto each row it covered; `REP_DEFINITION` (3, `week-2-monday-weights.ts`) → a `compound` row (elements with counts) + the "= 1 rep" framing in `notes`; `FOOTNOTE` rows → roles 2–4 a plain exercise row placed LAST in its schema, role 1 → placeholder; `cyclical`/`sandwich` exercise forms → `compound` with elements-as-written; `reps.implicit` → `null`; `total_flag` → plain `count` (value preserved, flag gone); max sub-forms/progressive seeds → `tail` text; `load.unspecified` → `null`; `without_weight` → `none`; weight `dual_value` → `load.byProfile{first, second}`.
- **Marker note:** seed has ZERO `INNER_LADDER_MARKER` rows (verified — block-037 is already expressed as parallel ladder sub-schemas; markers exist only in test fixtures). The stale `coverage-matrix.md` line expecting marker ≥ 1 is deleted, not satisfied.
- Coverage re-derived HONESTLY: `coverage-cells/`, `coverage-matrix.md`, and `seed-coverage.test.ts` (e.g. `EXPECTED_STRUCTURAL_PARALLEL_COUNT = 4` → a group-count assertion via the new model). Never force-fit an old count; if a re-derived number surprises you, flag it in the close-out.

**D7 — platform adaptation (round-trip parity; the W3 remap is OUT).** Surfaces: `apps/platform/src/modules/plan-detail/`, `apps/platform/src/lib/api/endpoints/schemas.ts`, `@app/lib/hooks`:

- **W1-RENDER-REPOINT:** clustering moves to the list level via the shared contracts helper; `SchemaGroupBox` renders a Group (label binds `group.label` → a new update-group mutation; placeholder "group…" behavior unchanged; interleave shown in the box meta line where the old summary suffix was). `schema-card.tsx` drops the `isBox` compute (lines ~90–94), the `subSchemas` recursion, and the in-card box. The `AccentGroupCard` VISUAL is unchanged — the owner accepted it at the walkthrough; only the gating source swaps.
- The in-box `AddSubSchemaButton` becomes "add schema into this group" → `POST /schemas` with `groupId`. In that modal context the «Group into one box» checkbox is HIDDEN (W1-SUBADD-BOX dissolution: adding INTO an existing box never asks the grouping question).
- `axis-editor-modal.tsx` fork (DR-W1-2 semantics preserved): checked → `POST …/groups` (atomic); unchecked → N independent `POST …/schemas` with `Idempotency-Key` threading (`use-create-independent-ladders.ts`; keep its client-side validation + coach-message parity, DR-W1-5). `use-create-parallel-schemas.ts`/`build-parallel-schemas.ts` are rewritten/renamed for the group call.
- Reorder parity: the sortable list maps over block items (groups as single sortable units, exactly as the parent-card was draggable before); on drop the client flattens to `orderedIds` keeping members contiguous and calls the existing reorder endpoint. Whatever reorder gestures exist today keep working scope-equivalently; NEW gestures (DnD-grouping, ungroup UI, member-remove UI) are W3 — do not build them.
- Dying editors deleted: `arrangement-axis-field`, `arrangement-convert`, the five dead row payload forms (footnote / standalone-url / standalone-load / inner-ladder-marker / rep-definition) + `row-editor-modal` dispatch slimmed to the 4 kinds; weight editor loses its `dual_value` branch; the load editor gains `byProfile` and `none` branches (authoring parity for shapes the seed now uses); `container-inspector` drops its arrangement/parallel branches (verify its remaining repetition/rest role first, §5.5); `format-composition-summary` loses parallel/superset/interleave branches.

**D8 — test migration.** Platform suite re-pins (W1's box tests re-target group fixtures; modal fork tests cover hidden-checkbox-in-group-context; MT-19 idempotency pin per D4; contiguity + dissolution + empty-group-cleanup coverage). Contracts test files updated for every reshaped schema (composition / composition-label / gauntlet / four-projection / schema-row / reps / load / weight / media / compounds). api-server tests REWRITTEN to the new model (the 7 files pinning parentSchemaId/parallel/arrangement/marker fixtures + seed-coverage) — but you can NOT run that suite (gated, owner-only); state in your close-out that the api-server gate is pending the owner's ritual.

**D9 — close-out docs ride the same PR:** promote your ratified in-build calls as DR-W2-\* into `initiatives/session-primitive/decisions.md`, update `deferred.md` rows you closed/produced, append the journal entry, update `state.md` — IN THIS PR, not after.

## 4. Hard red lines

1. **OPEN-decision surfaces are UNTOUCHABLE** (D-8 JIT rule): weight exotics (`split_tier`/`with_asymmetric_arm`/`with_depth_modifier` — F-WEIGHT-EXOTICS), `tempo` (F-TEMPO), `position` column/enum/UI (F-POSITION-CARRIER), `sequence` column (carrier → F-PLAQUE), `Block.timeCap` (F-BLOCK-TIMECAP), `Schema.header` semantics (F-HEADER — the column stays as-is), `or_alternative`, `perSetSubstitution*`, placeholder payload beyond the pairedConcreteRowId call, REST row shape (its plaque carrier is F-PLAQUE; the typed rest spec stays).
2. **The sacred core:** `repetition` 6 kinds + `rest` axis byte-compatible; Plan→Week→Day floors; plan-as-train enrollment.
3. **No recursion, no typed relation kinds, no child-count semantics** — anywhere, including "temporary" render shortcuts. The Group label is opaque text the system NEVER reads.
4. **One-predicate discipline:** box-ness/clustering ONLY via `groupId` membership and the ONE shared helper. Zero hand-rolled cluster/count checks in components or tests.
5. **No W3 scope:** no DnD-grouping of existing schemas, no ungroup UI, no member-remove UI, no draft↔contract mapper collapse beyond what the reshape forces.
6. **`Performed*` / `OneRMRecord`:** mechanical compile fixes only — they are known-wrong and redesign in Phase 4; do not build on them.
7. **Process:** no `--no-verify`/skip-flags; no AI/co-author trailers; no comments in code; conventional lowercase commits. Aggressive bridge-free migration per house style: NO compat shims/dual-read paths; intermediate trees may be RED locally, the FINAL pushed state must be green — squash to atomic green commits if the pre-commit hook blocks intermediate states.
8. **Never run:** root `pnpm test`, any api-server suite, `db:reset`/`db:seed` (owner runs the DB ritual), dev servers.

## 5. Verify-then-spec (design stage confirms in code BEFORE locking the plan)

1. The week/day GET include + mapper chain and WHERE the derived `schema.label` is computed server-side.
2. What `bootstrap-backend-di.ts` registers as the idempotency port (and the test-port story) before wiring D4.
3. Full seed inventory: every `parentSchemaId` producer; counts of FOOTNOTE / cyclical / sandwich / `dual_value` / `unspecified` / `total_flag` / `implicit` / STANDALONE\_\* occurrences (the §D6 list gives expectations; trust the grep, not the expectations).
4. `pairedConcreteRowId` producers (seed + fixtures) — kill-or-stop call per §2.
5. `container-inspector.tsx`'s exact current role before slimming it.
6. Every registration/barrel/exports file you will touch, read VERBATIM first: `packages/contracts/package.json` exports map, `packages/contracts/src/entities/lms/index.ts` + per-module barrels, `_shared/index.ts`, platform module barrels if any.
7. The existing reorder endpoint's order-assignment mechanics (you keep them; you only add the contiguity assertion + collapse the scope union).
8. The sibling Next route-handler style under `apps/platform/src/app/api/…` before adding the `groups` routes.
9. Which eslint/dep-cruiser rules fire on the deletions (unused exports, one-component-per-file, workspace boundaries) — run the linters early, not at the end.

## 6. Acceptance — the owner's walkthrough script (after HIS `db:reset` + seed ritual)

1. Open the seeded plan: the 4 ex-parallel blocks render as boxes VISUALLY IDENTICAL to W1 (incl. block-037's multi-track box); the block-010 shape shows ONE box whose label carries the rounds text; EMOM days render as a single cadence schema with slot rows — no nested cards anywhere.
2. Box label: edit → persists; clear → "group…" placeholder; reload → round-trips (now via the group, not a parent header).
3. Add-schema ladder batch with ≥ 2 tracks: checked → one box appears (atomic); unchecked → N independent plain cards.
4. Unchecked-path retry: after a simulated mid-batch failure, re-submitting does NOT duplicate the already-created cards (idempotent replay).
5. In-box add: a new member appears inside the box at its tail; the modal shows NO grouping checkbox in that context.
6. Delete box members down to the last one, then delete it → the box disappears with it (auto-cleanup).
7. Row editor offers exactly 4 row kinds; ex-URL/LOAD/footnote/rep-definition seed content reads correctly in its new shape (media on rows, materialized loads, footnote content as the last row, compounds where cyclical/sandwich were).
8. Reorder: boxes drag as single units; plain schemas reorder around them; members stay contiguous.
9. Owner ritual: gated api-server suite green on the reseeded DB (NOT yours to run — state it as pending).

## 7. Exact verify commands (the ONLY allowed test surface)

```bash
pnpm check-types && pnpm lint && pnpm dep:check
SKIP_ENV_VALIDATION=1 pnpm exec vitest run --project platform
pnpm --filter @repo/contracts test        # if the package has no test script, use the scoped vitest project equivalent — verify first
```

`pnpm --filter platform test` silently no-ops (false green) — never trust it. Root `pnpm test` and ANY api-server suite run are owner-gated: do not run them; the owner runs `db:reset` + seed + the gated suite as the final acceptance gate.

## 8. Process

- Branch: `feat/session-primitive-w2-model-core` off fresh `main`.
- Full `/feature` pipeline; surface REAL forks at Gate A (e.g. Prisma enum vs validated string for `interleaveOrder`; the group-create response embed shape; load editor byProfile UX) — forks are design choices with trade-offs, not permission-asking.
- Conventional lowercase commits, no trailers, no `--no-verify`. One PR. Vercel PR checks are noise (deployments not configured) — ignore them.
- Close-out docs in the SAME PR (D9). The orchestrator reviews the returned diff via git — write the close-out for that reader.
