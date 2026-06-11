# session-primitive — decisions

D-numbered ratified decisions. Step-level calls that don't merit a full ADR live here; cross-initiative architecture calls go to `docs/adr/`. **Promote here at every gate** — this file is the SSOT for "why."

**Status legend:** `RATIFIED` (decided + acted) · `OPEN` (awaiting owner ratification — do not execute past it) · `SUPERSEDED` (replaced — kept for the trail).

**Legitimacy lens (supersedes four-projection for this initiative):** the CHANNELS RULE (D-5). Four-projection invariance judged primitives against projections that don't exist (EXECUTES/ANALYTICS) and kept birthing inert stored surface — D-CADENCE ratified `window` days before ADR-0039 deleted it. Here a primitive is judged only against the projections that are LIVE (coach WRITES, human READS); hypothetical projections get a deferred note, never a stored field.

## Index

| ID                  | Topic                                                                            | Status   |
| ------------------- | -------------------------------------------------------------------------------- | -------- |
| D-1 SCOPE           | Target = the session primitive; fixed floors Session→Block→Schema→Row            | RATIFIED |
| D-2 BOX             | Relations = explicit Group boxes; opaque coach-owned label; no derivation        | RATIFIED |
| D-3 NO-RECURSION    | Sub-schemas die; no "group" schema-type tile; no graph                           | RATIFIED |
| D-4 NO-TYPED-REL    | No typed relation kinds (no parallel\|choice\|superset enum); text label only    | RATIFIED |
| D-5 CHANNELS        | Notation → structure \| typed field \| human text \| dropped syntax              | RATIFIED |
| D-6 GRID            | `primitive-spec.md` grid = the per-notation disposition (statuses inside)        | RATIFIED |
| D-7 PROCESS         | Orchestrator/runner model: план → промпт → ревью; /feature wrap; git review      | RATIFIED |
| D-8 JIT-FREEZE      | Implementation starts now; OPEN items close just-in-time before their wave       | RATIFIED |
| D-MARKER-DEATH      | `INNER_LADDER_MARKER` dies; rep-scheme ladder = one-row ladder-schema in Group   | RATIFIED |
| DR-W1-1 BOX-RENDER  | Parallel parent → `AccentGroupCard` box gated by the live one-predicate          | RATIFIED |
| DR-W1-2 CHECKBOX    | «Group into one box» = submit-branch flag; unchecked → N non-atomic flat creates | RATIFIED |
| DR-W1-3 HEAD-DEDUP  | Boxed parent: chip+title suppressed; `header` shown once in the box label zone   | RATIFIED |
| DR-W1-4 COPY        | Checkbox copy = English "Group into one box" (Gate A)                            | RATIFIED |
| DR-W1-5 INDEP-VALID | Unchecked path validates ladder steps client-side, coach-message parity (Gate B) | RATIFIED |
| DR-W2-1 GROUP-OWN   | `SchemaGroup` block-owned; SetNull dissolution; no `order` column                | RATIFIED |
| DR-W2-2 ARR-DEATH   | Arrangement axis dies whole; `composition = { repetition?, rest? }`              | RATIFIED |
| DR-W2-3 LEAF-KILLS  | Ratified Grid A/B leaf kills (reps/load/weight/media/schema-row/compounds)       | RATIFIED |
| DR-W2-4 IDEM-SCOPE  | D4 was ~90% pre-built; only client stable-key threading added; base = `draft.id` | RATIFIED |
| DR-W2-5 PAIRED-KILL | `pairedConcreteRowId` premise false (inert, 0 producers) → killed                | RATIFIED |
| DR-W2-6 BLK011      | block-011 rounds-over-rounds → 1-member Group "3 rounds:"                        | RATIFIED |
| DR-W2-7 BLK015      | block-015 interval-then-rounds → two sibling schemas (NOT a Group)               | RATIFIED |
| DR-W2-8 ORDER-UNIQ  | No `@@unique([blockId, order])`; deferred (W2-ORDER-UNIQUE → W3)                 | RATIFIED |
| DR-W2-9 CONTIGUITY  | Contiguity is a server invariant (`assertGroupMembersContiguous`)                | RATIFIED |
| DR-W2-FORK-1        | `interleaveOrder` = validated `String`, not a Prisma enum (Gate A)               | RATIFIED |
| DR-W2-FORK-2        | Group-create response embed = `{ group, members }` (flat `SchemaWithBody[]`)     | RATIFIED |
| DR-W2-FORK-3        | Load `byProfile` reuses the dual-value two-input layout (Gate A)                 | RATIFIED |
| DR-W2-FORK-4        | `interleaveOrder` editing moves OFF the schema ONTO the Group box meta           | RATIFIED |
| DR-W2-FORK-5        | Seed block-011/015 re-expression calls (the 2 extra non-parallel shapes)         | RATIFIED |
| DR-W2-FORK-6        | `buildBlockItems` lives in contracts (the new one-predicate)                     | RATIFIED |

---

### D-1 SCOPE — the primitive is the session and below; floors are fixed

- **Status:** RATIFIED (2026-06-10, owner).
- **Decision.** Redesign target = Session → Block → Schema → Row. Block stays a valid coach concept (a session's section: warm-up / strength / metcon). Cycles (micro/meso/macro) are a FUTURE enrichment layered above the primitive — out of scope; nothing here may block that layering.
- **Rationale (owner verbatim).** "блок внутри тренировки это валидная история, ведь тренировочная сессия состоит из частей/блоков. а цикличность … это про микро/мезо/макро циклы. … мы сейчас дизайним модель примитива внутри программирования. примитив это тренировочная сессия и ниже, который наполняет циклы. и сделать мы не можем именно примитив." + "касательно структуры одной отдельной сессии я так и вижу: сессия - блок - схема - строка."

### D-2 BOX — relations are explicit boxes with opaque labels

- **Status:** RATIFIED (2026-06-10, owner-designed).
- **Decision.** A relation between siblings = membership in an explicit Group node. The Group holds ordered, CONTIGUOUS members and an optional free-text label. The system renders the box and carries the label; it never interprets the label. No sibling→sibling references of any kind. Grouping happens only by explicit coach gesture (DnD one element onto another; batch flows via an opt-in checkbox in the add-schema modal — the box is visible and dissolves in one click). NO semantics are derived from child count.
- **Rationale (owner verbatim).** "сиблинги не должны знать о 'связях' между собой. связывает блок. он просто берёт набор элементов и говорит 'вот, они лежат в одной коробке, а вот у меня ещё есть лейбл, я не вижу что на нём написано, но ты можешь прочитать, изменить или удалить его'. … 'связь' это исключительно представление и структура, потому как связать мы можем только элементы идущие подряд. … то что более одной лесенки мы сразу же связываем — это мы уже думаем за Дена и потенциально делаем медвежью услугу." Batch-create is UX convenience; auto-link is a semantic decision — decoupled ("это разруливается одним простым чек-боксом в модалке add schema").
- **Consequences.** Supersedes-forward ADR-0040's derived-parallel mechanism (`isStructurallyParallel`) at implementation time — the box IS the structure, nothing is inferred from child count. The stored superset rowId-pairs (the last sibling-ref surface) die into row-level grouping. Until implementation lands, ADR-0040 remains the live behavior of main.

### D-3 NO-RECURSION — the матрёшка dies

- **Status:** RATIFIED (2026-06-10).
- **Decision.** `Schema.parentSchemaId` and sub-schema nesting are removed. Grouping needs are served by the Group level(s), not recursion. Rejected alternatives: (a) "parallel as a schema TYPE" with its own add-modal tile — recursion in a hat + the picker-first smell ADR-0037 killed; the add-schema modal stays primitives-only and `add sub-schema` dies; (b) graph links — violates the owner's own contiguity rule ("связать мы можем только элементы идущие подряд"), is render-hostile, and re-opens the dangling-ref bug class ADR-0040/step-2 just buried.
- **Rationale.** Owner's diagnosis: sub-schemas were added as the carrier of "связь" without ever designing how to SHOW it ("мы нащупали связь ещё тогда, только не раскрутили её в рассуждении достаточно"). The product evidence is damning: recursion existed for a month, the editor had to "unlock" it (ADR-0039 §B), one pattern's authoring took a bespoke initiative, and a step-1 CRITICAL came from recursion ambiguity (the structural-kind trap). Fixed levels + explicit boxes give every level a DESIGNED affordance instead of a generic tree editor.
- **Consequences.** Corpus depth-3 ("rounds over parallel ladders", block-010) re-expresses as a Group whose label carries "5 rounds:" until an engine needs typed rounds-on-group (BACKLOG-ROUNDS disposition). Max structural depth = Block → Group → Schema → row-grouping → Row.

### D-4 NO-TYPED-REL — relation kinds are not typed

- **Status:** RATIFIED (2026-06-10, owner counter — assistant's typed-core proposal withdrawn).
- **Decision.** No `relation: parallel | choice | superset | custom` enum — not on Group, not anywhere. The label is free text. If the view layer ever special-cases known labels, that is presentation only and never stored. Specific relation kinds get typed semantics ONLY when a real engine (executor/scoring/analytics) reads them — designed against that engine, per the ADR-0038 re-introduce-fresh principle.
- **Rationale (owner's applicability-matrix counter, verbatim).** "parallel логически применяется только к схеме, choice валидно для схемы и строки (упражнения), superset пожалуй только для строки, а ты предлагаешь это всё пихать в одно место. запашок чувствуется неприятный…" — one field whose values have different validity domains = per-level guards, refusal channels, inert variants: the exact disease the June drains removed. Also by D-5's own test: today no machine reads relation semantics (composition is inert; the only consumers are write + human read), so relation meaning is channel-3 (human text), not channel-2 (typed field).

### D-5 CHANNELS — the notation-mapping rule

- **Status:** RATIFIED (2026-06-10).
- **Decision.** Every notation the coach writes maps to exactly one of four channels: **structure** (grouping, ordering, nesting-by-floors) · **typed field** (only what a machine actually reads: renders specially, computes, validates) · **human text** (the system carries and displays, never interprets; concrete carrier per case — library entry / plaque / notes — see F-CHIPS/F-PLAQUE/F-POSITION-CARRIER) · **dropped syntax** (brackets, case, word order — never stored). Expressibility is mandatory for EVERYTHING the coach writes, even cardinality-1 ("если это встречается хоть раз, то уровень абстракции модели … должен позволять Дену реализовать это"); a dedicated TYPE is not.
- **Rationale.** The genesis disease was forcing all four channels into channel 2 ("каждой нотации — личный тип"), including channel 4 (`wrapped: boolean`). The corpus is the FLOOR of expressiveness, not the ceiling: it is ONE personal plan (written for Maksim), so group-programming notations are systematically underrepresented — `dual_value` m/f load appears once precisely BECAUSE the plan had one athlete; RX/SC appears zero times. Owner: "м/ж вес в кроссфите встречается сплошь и рядом. так же как и rx/sc. … сама концепция валидная."

### D-6 GRID — the per-notation disposition lives in primitive-spec.md

- **Status:** RATIFIED (2026-06-10) — for rows marked RATIFIED/ACCEPTED there; rows marked OPEN (F-\*) are NOT ratified.
- **Decision.** `primitive-spec.md` §Grid is the single disposition table: every corpus notation → channel + verdict + status. Owner-contested calls folded in verbatim:
  - **[ TOTAL ] is dead entirely** — not even a flag: "это же буквально фложок для квадратных скобок. даже не думай об этом, этот [ TOTAL ] ни на что не влияет. строка-упражнение для тренера уже есть — добавляет, ставит 30 повторений и всё."
  - **Footnote `*`/`**` = ordering\*\*, no type, no chip: "5 hspu после каждого раунда это просто строка Упражнение + reps которое стоит последним в раунде. … 'в конце каждого раунда' — так бляха, поставь его в конец."
  - **Per-set substitution = row-level grouping**, no typed mapping: "так это же группа на уровне строк, это не кейс для обсуждения, уникальности ноль, модель уже это покрывает."
  - **Placeholder slot stays typed for now**, flagged smelly: "это плохо пахнет, но я пока не понимаю почему. пока пусть живет." (→ F-SLOT)
  - **dual_value load stays** (m/f standard; resolver designed when athlete context exists): "нет резолвера — будет … сама концепция валидная, момент её появления в модели сомнителен."

### D-7 PROCESS — orchestrator/runner working model

- **Status:** RATIFIED (2026-06-10, owner-proposed).
- **Decision.** Orchestrator (this session's role): research, deep analysis, design WITH the owner, planning, writing executor prompts, reviewing executed work. Owner: discussion + ratification + transport ("взял промпт — отнес — флагнул когда модель закончила выполнение"). Mechanics: every implementation step = its own runner session wrapped in `/feature` (full or small by scope), ≤1 full (or 2 small) per session; prompts are self-contained (the runner has none of this context); the orchestrator reviews via git diff after each run — never via the runner's self-report; migration steps are aggressive/bridge-free per house style (final state green, no compat shims).
- **Rationale.** The proven planner/executor pattern minus the shuttle ceremony; review-via-git is a standing house rule (long agent runs over-report).

### D-MARKER-DEATH — `INNER_LADDER_MARKER` dies

- **Status:** RATIFIED (2026-06-11, owner: "да, вырываем с корнем").
- **Decision.** The marker row kind (38 corpus occurrences, ~15 schemas, no authoring flow — MARKER-FATE inherited) is removed. Its case — per-track single-movement rep-scheme ladders (Block C `21-15-9 ‖ 9-15-21`) — re-expresses as N one-row ladder-schemas inside a Group. D-LADDER's semantic distinction (shared round-counter vs per-track rep-scheme) SURVIVES as two different STRUCTURES (one ladder-schema with N rows vs a Group of N one-row ladder-schemas) instead of two different fields; the forbidden-fusion guard and QA-001 collision die as unrepresentable.
- **Supersession note.** This supersedes the "D-LADDER is sacred / do NOT remove the marker" clause carried by both predecessor initiatives — mechanism superseded, semantics preserved (the distinction lives on as structure, channel-С per D-5). The cut lands in W2: contract payload variant + Prisma enum value + the forbidden-fusion superRefine + test fixtures. **Seed correction (verified at prompt-writing, 2026-06-11):** the seed contains ZERO marker rows — block-037 is already expressed as parallel ladder sub-schemas; the "38 occurrences / ~15 schemas" are CORPUS facts (grid expressibility), not seed data; `coverage-matrix.md`'s stale "marker ≥1" line dies with the cut, unsatisfied.

### D-8 JIT-FREEZE — implementation starts on the ratified core; follow-ups close just-in-time

- **Status:** RATIFIED (2026-06-10, owner: "давай промпт, я готов запускать").
- **Decision.** The founding plan's full-spec-freeze gate is relaxed. Runner sessions may start NOW under one rule: a runner works ONLY on grid rows whose status is RATIFIED/ACCEPTED; every OPEN item (F-\*, D-MARKER-DEATH) closes just-in-time before the wave that needs it. Wave map (plan.md): W1 Group/box UX on mocks needs nothing open; W2 model core needs D-MARKER-DEATH; W4 row grammar + leaf residuals needs F-PLAQUE + the leaf F-rows.
- **Rationale.** Dependency-honest: the schema-level world is fully ratified (D-2/D-3); the OPEN items gate only the row-level grammar and part of the leaf. Serializing all implementation behind design-fatigued follow-ups buys no safety — the house aggressive-migration rules already tolerate staged green intermediate states.

---

## W1 implementation calls (DR-W1-\*) — Group/box UX on the existing model

W1 re-skins the live ADR-0040 mechanism and adds an explicit creation affordance; it does NOT build the Group entity (that is W2). All five are platform-only, ratified during the W1 `/feature` build (2026-06-10), forks routed through Gate A / Gate B.

### DR-W1-1 BOX-RENDER — parallel parent renders as a box, gated by the one-predicate

- **Status:** RATIFIED (2026-06-10, W1 build; visual chosen by owner at Gate A).
- **Decision.** A structurally-parallel parent renders as a BOX: the shared `@repo/ui` `AccentGroupCard` (`accent-dashed` — dashed `alpha(primary.main)` frame + tinted label zone) wrapping the member sub-schema list + the relocated in-box `AddSubSchemaButton`. Box-ness is `composition !== null && isStructurallyParallel(composition, { containerChildCount: subSchemas.length })`, computed ONCE in `schema-card.tsx` and threaded down — byte-identical to the chip signal, NEVER a hand-rolled child-count.
- **Rationale.** The ONE-PREDICATE rule: ADR-0040's CRITICAL came from a reader consulting a field instead of the shared predicate. Gate A chose `accent-dashed` over the calmer solid-divider alternative ("reads unmistakably as ONE unit"); colours stay in the palette (`alpha`, no hex). EMOM/cadence/rounds/leaf parents keep the plain list (predicate-gated). Depth-3 (block-010) works for free via recursion — the outer rounds card stays plain, the middle parent draws its own box.
- **Consequences.** Supersede-forward at W2: when the Group entity lands, box-ness re-points from `isStructurallyParallel` to real Group membership — the render swaps its gating source, the visual is unchanged (carry-forward W1-RENDER-REPOINT).

### DR-W1-2 CHECKBOX — explicit-link checkbox is a submit-branch flag, not a draft mutation

- **Status:** RATIFIED (2026-06-10, W1 build).
- **Decision.** The «Group into one box» checkbox (default CHECKED, shown only at ≥2 ladder tracks) is a submit-branch `boolean` in `AxisEditorModal`: checked → `submitParallelCreate` (atomic `POST …/schemas/parallel`, unchanged); unchecked → `submitIndependentLadders` via the new platform-local `useCreateIndependentLadders` hook, firing N independent flat `POST …/schemas` (no `parentSchemaId` → N top-level cards, no box). The draft stays N-track-shaped; the `parallel-ladder-draft` transforms are untouched.
- **Rationale.** D-2's de-bear-ification of auto-link: ≥2 ladders no longer FORCE a box. The materialize/dematerialize-toggle alternative was rejected — `dematerializeToFlat` only collapses exactly 1 track and would destroy N-track editing. The unchecked path is non-atomic BY DESIGN (D-2: batch-create is UX convenience, not a semantic guarantee; partial-success has no rollback, each schema is a complete unit).
- **Consequences.** Retry-after-partial-failure can duplicate the already-created cards (no idempotency, no `@@unique` on top-level schemas) — accepted for W1, carried to W2 (W1-DUP-RETRY).

### DR-W1-3 HEAD-DEDUP — header appears once, in the box label zone

- **Status:** RATIFIED (2026-06-10, W1 build).
- **Decision.** On a boxed parent the `parallel` `SchemaCompositionTag` chip AND the card-head title are suppressed; the parent's `header` is shown + edited ONCE, in the box label zone, via `InlineEditText` reusing the existing `handleTitleCommit` → `useUpdateSchema` → `{ header }` path. The label binds the RAW `header ?? ""` (empty → neutral placeholder "group…", NOT the derived structural label, NOT an empty chip). The `deriveCompositionLabel` / `formatCompositionSummary` MECHANISM and the meta summary ("parallel (round by round)") are untouched.
- **Rationale.** Deliverable-2 directive: dedupe the PRESENTATION, not the mechanism. No information is lost — the interleave-order stays in the meta summary; non-boxed parents are byte-identical to before. No new field (header is already a stored, updatable column).

### DR-W1-4 COPY — checkbox copy is English

- **Status:** RATIFIED (2026-06-10, owner at Gate A).
- **Decision.** The checkbox visible copy is "Group into one box" (English), not the Russian "связать в коробку" of the prompt's semantics.
- **Rationale.** The platform UI is all-English ("Add schema", "another ladder"); a lone Russian string would read foreign. Localization, if it ever comes, is a separate systematic pass. (The prompt gave Russian only as the SEMANTICS; the exact copy was deferred to design → Gate A.)

### DR-W1-5 INDEP-VALID — the unchecked path validates client-side with coach-message parity

- **Status:** RATIFIED (2026-06-10, owner at Gate B — QA-003 fix).
- **Decision.** Before firing any create, `useCreateIndependentLadders` validates each track's ladder steps client-side against the exact `createSchemaRequestSchema` it will POST, and on the first invalid track surfaces a coach-friendly per-ladder message ("ladder N, step M: …") mirroring the parallel path's `formatCoachIssue`. A degenerate step (e.g. `0`, producible via the step input's `coerceStepValue`) is caught up-front, never as a raw server-error string. The hook's invalidate + pending-clear were wrapped in `finally` (parity with the parallel sibling) since the validation added a throw point.
- **Rationale.** UX parity — the checked (parallel) path already validated client-side with coach-friendly messages; the unchecked path degraded to a cryptic server string for the same input. coach-daily-UX is the project's #1 bar. Validating all tracks up-front also prevents firing K good creates and then 400-ing on the (K+1)th. Owner elected the fix at Gate B over deferring.

---

## W2 implementation calls (DR-W2-\*) — the model core: Group entity, recursion/arrangement death, ratified leaf kills

W2 makes the box REAL — a persisted `SchemaGroup` entity owns membership; `parentSchemaId` recursion dies; the composition `arrangement` axis dies whole; the ratified Grid A/B leaf kills land; the seed re-expresses; guards re-derive. After W2 the stored model is exactly the ratified skeleton `Session → Block → [Group?] → Schema → Row` (NO recursion). Ratified during the W2 `/feature` build (2026-06-11, branch `feat/session-primitive-w2-model-core`); forks routed through Gate A. Cross-initiative one-way-door framing → `docs/adr/0041-session-primitive-model-core.md` (supersedes ADR-0040). These promote the design's §8 decision record (`.feature-dev/1781171129/design.md`) with the in-build deviations actually taken folded in.

### DR-W2-1 GROUP-OWN — `SchemaGroup` ownership + SetNull dissolution + no order column

- **Status:** RATIFIED (2026-06-11, W2 build).
- **Decision.** `SchemaGroup` is block-owned (`onDelete: Cascade` from Block). Members link via `Schema.groupId` with `onDelete: SetNull`, so deleting a group DISSOLVES it — members survive as plain block-level schemas, keeping their `order`. The Group has **NO `order` column**: its position among block items is DERIVED from `min(member.order)`. Membership is the ONLY sibling relation (D-2). `@@index([groupId])` on Schema (FK), `@@index([blockId])` on SchemaGroup (FK).
- **Rationale.** D-2 verbatim — "связать мы можем только элементы идущие подряд": the box IS the structure, nothing is inferred from child count. The `min(member.order)` derivation is the ONE legitimate derivation (it derives a render position from the structural membership relation itself, not box-ness/semantics from child count). SetNull (not Cascade) so dissolving a box is non-destructive — the coach loses the grouping, never the schemas.
- **Consequences.** A group can hold exactly 1 member (block-011, DR-W2-6) — structurally legal; the contiguity invariant trivially holds. The public create API stays 2+-track (`tracks.min(2)`); the seed authors a 1-member group directly via Prisma. Deleting the last member auto-deletes the now-empty group in the same transaction.

### DR-W2-2 ARR-DEATH — the arrangement axis dies whole

- **Status:** RATIFIED (2026-06-11, W2 build).
- **Decision.** `arrangement`, `supersetPair`, the top-level `interleaveOrder` field, `ARRANGEMENT_AXIS_KINDS`, `isStructurallyParallel`, `CompositionStructure`, the `parallel`/`superset` label kinds + families, the compose-tree recursion (`z.lazy`), and the marker `superRefine` all die. `composition` becomes `{ repetition?, rest? }.strict()`. `PARALLEL_INTERLEAVE_ORDERS` + `DEFAULT_INTERLEAVE_ORDER` MOVE to the new `schema-group` module (values unchanged: `round_by_round | track_by_track`). `deriveCompositionLabel` / `deriveKind` lose the `structure` param → pure functions of `composition.repetition`.
- **Rationale.** D-2/D-3: parallelism is no longer DERIVED (ADR-0040's `isStructurallyParallel`) — it is explicit Group membership. The arrangement axis was the last derived-relation surface; with the Group entity it has no consumer. The compose-tree recursion dies with `parentSchemaId` (containers hold rows only).
- **Consequences.** Three `z.lazy` recursive type definitions are removed (`schemaSchema`, `schemaWithBodySchema`, the compose container) — a net type simplification. `SchemaWithBody = { schema, rows }` (no `subSchemas`). Supersedes ADR-0040 wholesale (the derive-parallelism decision) → ADR-0041.

### DR-W2-3 LEAF-KILLS — the ratified Grid A/B leaf kills

- **Status:** RATIFIED (2026-06-11, W2 build — Grid A/B RATIFIED/ACCEPTED rows ONLY; the OPEN F-rows are red lines, untouched).
- **Decision.** reps: `implicit`/`total_flag`/`compound_rep_unit` die (`implicit` → `reps: null`, render resolves from ladder context; `total_flag` → plain `count`, value preserved; `compound_rep_unit` → the `compound` row form); `max` slims to `{ kind: "max", tail?: string }` (`MAX_SUB_FORMS`/`progressiveSeed`/`targetExerciseId` die → free-text tail); `compoundRepDefinitionSchema` + `COMPOUND_REP_DEFINITION_FORMS` die (REP_DEFINITION kill). load: kinds → `absolute | percentage | bodyweight | byProfile | none` (`byProfile {first, second}` = the ex-`dual_value` m/f pair PROMOTED from weight-variant; `resolver: "athlete_profile"` literal dropped; `without_weight` → `none`; `unspecified` → `null`). weight: ONLY `dual_value` removed; `single | dual | single_arm | compound_device | split_tier | with_asymmetric_arm | with_depth_modifier` ALL STAY (exotics = OPEN F-WEIGHT-EXOTICS). media: `{ url, label? }` (`MEDIA_POSITIONS`/`MEDIA_APPLIES_TO` die — placement = which node carries the media). schema-row: `RowKind` → `EXERCISE | REST | PLACEHOLDER | REST_SLOT` (FOOTNOTE/STANDALONE_LOAD/STANDALONE_URL/INNER_LADDER_MARKER/REP_DEFINITION + satellite schemas/constants die); the `compoundRep` column dies. compounds: `cyclical`/`sandwich` + their `EXERCISE_FORMS` entries die (`compoundRowSchema` is the one ratified compound form, unchanged); `atomic`/`compound`/`or_alternative`/`placeholder_ref` stay (`or_alternative` death rides W4).
- **Rationale.** D-5 channels + D-6 owner bars: parsing residue (8-variant weight, 9 row kinds, the bracket-flag axes) was frozen as types from ONE personal plan. Each kill removes a cardinality-1 (or 0) member with no live machine reader. `byProfile` is the one PROMOTION (m/f load is real per D-5 despite corpus cardinality 1). The kept weight exotics + `or_alternative` + `perSetSubstitution*` are OPEN F-rows (red lines, JIT-frozen per D-8).
- **Consequences.** Surviving rejection tests pin the kills (`schema-row.schema.test.ts` rejects `INNER_LADDER_MARKER`; `weight.test.ts` rejects `dual_value`; `reps.test.ts` rejects `total_flag`). The dual-value field component was renamed (DR-W2-FORK-3), not deleted.

### DR-W2-4 IDEM-SCOPE — D4 corrected scope (idempotency was ~90% pre-built)

- **Status:** RATIFIED (2026-06-11, W2 build).
- **Decision.** The prompt framed D4 as a from-scratch build; the verify-pass found it ~90% already built. Server idempotency is COMPLETE (`wrapAuthHandler` baked into every `createAuth{Post,…}` factory; `prismaIdempotencyStore` bootstrapped in `bootstrap-backend-di.ts`; `POST …/schemas` and `POST …/groups` already idempotency-capable) — NO new server route work. The client `ApiClient` already attaches `Idempotency-Key = options?.idempotencyKey ?? crypto.randomUUID()`. The ONLY D4 work: (1) `api.schemas.create` accepts + forwards an `idempotencyKey`; (2) `useCreateIndependentLadders` threads a STABLE key per track, `${base}:${trackIndex}`; (3) the MT-19 client-threading unit test. **The base key = the draft-session id (`draft.id`)** — minted once when the modal seeds the draft. **QA-004 boundary (by design):** an in-modal retry replays/dedups (same `draft.id` → identical keys → server replays the already-created tracks → no duplicate); a close+reopen mints a FRESH `draft.id` → a fresh batch. Across-session re-submit is treated as NEW intent intentionally — deduping it would wrongly block intentional re-creation. The W1-DUP-RETRY acceptance scenario (in-session retry, §6.4) is satisfied.
- **Rationale.** House pattern reuse (the dormant `@repo/api-routes` layer) over a new DB column. `draft.id` is superior to the design's literal "fresh per-`run()` uuid" — a per-run uuid would regenerate keys and DEFEAT replay, failing acceptance §6.4. The session-scoped boundary is the correct UX semantics (reopening the modal = a fresh authoring gesture).
- **Consequences.** The api-server replay path (server integration) is owner-gated, NOT run by the pipeline; the close-out states it PENDING the owner's ritual. The close+reopen boundary is documented as a carry-forward (W2→W3 INFO) and pinned by a regression-tripwire test (MT-19 sibling) so a future "fix" is a conscious change.

### DR-W2-5 PAIRED-KILL — `pairedConcreteRowId` premise-correction + kill

- **Status:** RATIFIED (2026-06-11, W2 build — premise verified false in code before acting).
- **Decision.** The prompt's §2 premise (that `pairedConcreteRowId` serves footnote role-1 pairing) is FALSE. It is an inert opaque passthrough on `placeholderPayloadSchema` (`compounds.ts:102`), used only in the platform placeholder form + draft types; ZERO seed producers; ZERO footnote linkage. It is a D-2-violating sibling-ref, currently dead. KILLED: the field + the platform carry branches + the 4 contract-test + 8 platform-test asserts. No STOP needed (the kill-or-stop gate the prompt set was cleared by verification).
- **Rationale.** D-2 forbids sibling→sibling refs. A dead inert field is the cleanest possible kill — no live behavior to preserve. Verified-before-acting per the planner anti-pattern-specing rule.
- **Consequences.** `placeholderPayloadSchema` keeps `placeholderKind`/`text` (OPEN F-SLOT, untouched); `perSetSubstitution*` stays (its kill rides W4's row-grouping carrier).

### DR-W2-6 BLK011 — block-011 re-expression: 1-member Group "3 rounds:"

- **Status:** RATIFIED (2026-06-11, W2 build — Gate-A fork resolution, see DR-W2-FORK-5).
- **Decision.** block-011 (rounds-over-rounds: outer `rounds(3)`, no direct rows, ONE inner sub-schema = `rounds(5)` + rest + a thruster row) → a **Group labeled "3 rounds:"** (channel-3, BACKLOG-ROUNDS) with ONE member schema (the inner `rounds(5)` thruster schema). Mirrors the block-010 depth-3 treatment exactly (a Group whose label carries the outer rounds text; member = the inner repetition schema).
- **Rationale.** Identical shape to block-010's outer-sub (rounds-over-X) → identical re-expression (label-carry). The outer rounds count survives as label text until a rounds-on-Group engine exists (BACKLOG-ROUNDS); the inner rounds + rest + row preserved verbatim. NO data loss.
- **Consequences.** A 1-member group is NOT creatable via the public API (`tracks.min(2)`) — the SEED authors it directly via Prisma. `buildBlockItems` renders it as a single-member box carrying the label. The verified-correct re-expression: the dbSnatch `compound_rep_unit` reps drop to `null`, resolved by ladder context (the ratified implicit-reps treatment).

### DR-W2-7 BLK015 — block-015 re-expression: two sibling schemas (NOT a Group)

- **Status:** RATIFIED (2026-06-11, W2 build — Gate-A fork resolution, see DR-W2-FORK-5).
- **Decision.** block-015 (interval-then-rounds: a parent with its OWN repetition `interval(1,1,4)` + ONE direct row (run) + ONE sub-schema `count(3)` with 3 rows) → **TWO ordered sibling schemas in the block, NO Group**: schema 1 = `interval(1,1,4)` + the run row; schema 2 = `count(3)` + the kbSwing/boxJump/burpee rows. Schema order IS the "then" semantics (spec connector ruling: "schema order already says 'then'"). The inner-row media reshapes to `{ url, label? }`.
- **Rationale.** A Group holds MEMBER SCHEMAS, not loose rows + a schema — this parent mixes direct rows + a sub-schema, so it CANNOT become a single Group without inventing forbidden structure. "intervals THEN rounds" = two schemas in sequence (the parts have different repetitions + different movements — they are NOT parallel tracks). The depth-2 nesting was a recursion artifact; sequence = sibling order. NO data loss; the structure becomes flatter and MORE faithful to the ratified skeleton.
- **Consequences.** A Group of 2 here would WRONGLY imply parallelism (one box shown together) — rejected. The dying parent's `header` ("intervals then rounds") carries no `notes`/`intensity` (verified), so dropping it loses nothing (the two-schema sequence is self-describing).

### DR-W2-8 ORDER-UNIQ — no `@@unique([blockId, order])` (W2-ORDER-UNIQUE → W3)

- **Status:** RATIFIED (2026-06-11, W2 build — consciously deferred).
- **Decision.** `@@unique([blockId, order])` is consciously NOT added when `parentSchemaId` dies. Deferred as carry-forward **W2-ORDER-UNIQUE → W3**.
- **Rationale.** Today's top-level order was NEVER DB-enforced — the old unique keyed nullable `parentSchemaId`, and Postgres NULLs never collide. So omitting it is NO regression. Adding it forces a two-phase reorder rewrite (the negative-order dance interacts with a live unique) that belongs to W3's editor/reorder rebuild.
- **Consequences.** The reorder endpoint keeps its plain (non-Serializable) `$transaction` two-phase negative-order dance verbatim; order ties cannot even error today (QA-011/QA-012 — unreachable on happy-path flows, gated by Serializable+retry on the create paths). W3's `@@unique` work re-examines the negative-order phase + isolation.

### DR-W2-9 CONTIGUITY — contiguity is a server invariant, not a client convention

- **Status:** RATIFIED (2026-06-11, W2 build).
- **Decision.** A group's members form a CONTIGUOUS `order` run within their block. Enforced SERVER-side by `assertGroupMembersContiguous` (O(n) over the block's ordered schema list) on group create, create-into-group, and reorder (reject non-contiguous with a coach-readable `BadRequestError` + structured `details`). `buildBlockItems` TRUSTS the invariant (it clusters/positions defensively but does not re-enforce).
- **Rationale.** D-2 contiguity is structural truth; the server is the single enforcement point. A client-side convention would let a hostile/buggy payload split a group; the assertion makes the split unrepresentable.
- **Consequences.** On corrupt data (DB bypass), `buildBlockItems` re-clusters gracefully (group at `min(order)`, interleaved non-member ejected below the box) — no crash, no drop (QA-006, by design). The throw message is developer-readable (QA-003) — acceptable because the UI cannot produce a split (the client DnD operates at group-as-unit granularity); revisit wording if W3's ungroup/member-move UI makes it coach-reachable.

### DR-W2-FORK-1..6 — the Gate-A fork resolutions

The six design forks (§6 of the design doc), each ratified at Gate A; the implementer proceeded on the recommendation.

- **DR-W2-FORK-1 — `interleaveOrder` storage = validated `String`** (`@default("round_by_round")`), NOT a Prisma enum, with `z.enum(PARALLEL_INTERLEAVE_ORDERS)` at the contract boundary. Matches the house Json/string convention for plan-content axes; the engine never reads it (display-only, channel-3-adjacent per D-5); a Prisma enum would couple a 2-value toggle to a migration in a db:reset-only world. The mapper parses with `z.enum(...).parse(...)` (a corrupt DB string surfaces as a parse error, like every Json column).
- **DR-W2-FORK-2 — Group-create response embed = `{ group, members }`** where `members` is the FLAT `SchemaWithBody[]` (`{ schema, rows }`, no `subSchemas`). The client needs the created members' ids/rows to render the box immediately; the invalidate still fires. Rejected `{ group }`-only (blanks the box for a frame) — diverges from the old `createParallel` full-body contract.
- **DR-W2-FORK-3 — Load `byProfile` reuses the two-input layout.** The ex-`weight-dual-value-fields.tsx` two-input layout is re-homed under the load editor (in-build: renamed to `load-by-profile-fields.tsx` + a sibling `load-none-fields.tsx`, NOT a literal re-home — equivalent layout, labels changed `First/Second value` → `Male (kg)` / `Female (kg)`, a coach-fidelity improvement). `dual_value` weight and `byProfile` load are the SAME m/f pair semantically. Reuse-before-invent.
- **DR-W2-FORK-4 — `interleaveOrder` editing moves OFF the per-schema `container-inspector` ONTO the Group box meta** as a group-update mutation (`PUT …/groups/{id}` `{ interleaveOrder }`). The field is now a property of the Group, not a schema's composition; editing it on the box is where the coach reads it. There is no per-schema home for it after the field leaves `composition`.
- **DR-W2-FORK-5 — the block-011/015 re-expression calls** = DR-W2-6 + DR-W2-7 (the two extra non-parallel `subSchemas` shapes that are neither parallel-parents nor in the prompt's 3 named classes). STOP-check cleared: neither dying parent carried `notes`/`intensity` beyond `header` (verified).
- **DR-W2-FORK-6 — `buildBlockItems` lives in contracts** (the `schema-group` module, `block-items.ts`), signature `buildBlockItems(schemas: SchemaWithBody[], groups: SchemaGroup[]): BlockItem[]` with `BlockItem = { kind:"schema"; schema } | { kind:"group"; group; members }`. It is the SOLE clustering source (red line #4, the new one-predicate replacing `isStructurallyParallel`) — depends only on schema + schema-group (no `block/` import → no cycle; `dep:check` green). In-build: imported in EXACTLY one render site (`block-card-body.tsx`) + its test; zero hand-rolled cluster loops.
