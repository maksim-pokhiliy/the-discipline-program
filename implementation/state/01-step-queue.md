# Step queue

> Tree of workflow steps + sub-steps with status. Updated on every close-out and on thesis-time decomposition refinement.
>
> Step 8 / Step 9 sections expanded + resequenced 2026-05-20 under D3 (roadmap.md §"Phase 0" + roadmap decision log) — full hand-rolled coverage всех 34 archetypes + 9 SchemaRow rowKinds + 7 composite VOs. Каждый new sub-step несёт 1-line coach walkthrough stub per [[coach-walkthrough-gate]]. Existing infrastructure sub-steps (8.1c → 8.3.7) untouched.
>
> **Execution order ≠ numeric order.** Step 9 (SchemaRow editor) executes **after** anchor 8.4, **before** archetype expansion 8.5..8.20. Rationale: пустой archetype без row editor для тренера бесполезен; anchor 8.4 + Step 9 = первый genuinely usable продукт (2 рабочих archetype с реальными упражнениями); каждый archetype в expansion 8.5+ сразу получает готовый row editor для body. Numeric `9.x` tag remains thematic (row-editor theme); queue section order below = execution order. Precedent для гибкой нумерации: `8.3.5`, `8.3.7-pre`.

Granularity locked at thesis time; some steps may expand into sub-steps as decomposition is ratified.

## Completed

- **Step 1** — Model ratification (no code). 4 ratified decisions applied к analysis-artifacts. **COMPLETED** 2026-05-12.
- **Step 2** — Prisma schema port + Archetype seed (34 canonical) + minimal user/plan seed. `db:reset` per ADR-0019. **COMPLETED** 2026-05-12.
- **Step 3** — Admin Exercise CRUD + Phase 0 D5 schema refinement. **COMPLETED** 2026-05-13 (HEAD `51302f93`). Canonical reference template для future catalog-library CRUD modules.
- **Step 4** — Admin Label CRUD. **COMPLETED** 2026-05-14 (HEAD `252d7323`). Structural mirror Step 3 + `applicableLevels` multi-value widget.
- ~~**Step 5**~~ — Platform plan list / create-plan flow. **DROPPED** 2026-05-14. Found already implemented as pre-existing base LMS infrastructure.
- **Step 5** (was Step 6) — Plan-detail shell (calendar viewport). **COMPLETED** 2026-05-15. `lms/week` slice + `lmsWeekApi` + InlineEditText + plan-detail module.
- **Step 6** — Day-level + Session-level operations + day-metadata side-channel + platform-side Label read-mirror. **COMPLETED** 2026-05-15 → 2026-05-17.
- **Step 7** — Block-level operations. **COMPLETED** 2026-05-18. 7.0 contracts → 7.1 api-server → 7.2 routes → 7.3 client hooks → 7.3.5 read-embed enabler → 7.3.6 Block @@unique constraint → 7.4 Block UI → 7.5 Intensity + TimeCap UI.
- **Step 8.0a** — VO infrastructure в `lms/_shared/`: 11 new Zod schema modules. **COMPLETED** 2026-05-18 (`92b8f915..1608a83a`).
- **Step 8.0b** — Entity contract slice: Schema + SchemaRow + SchemaPairing + Archetype + drop `RowKind.CONNECTOR` per D12 + analysis-artifacts sync. **COMPLETED** 2026-05-18 (`55f5c49e..2d8a4409`).
- **Step 8.1a** — `lmsSchemaApi` (CRUD + two-pass reorder + parent-vs-child discriminated create per D10 + sub-schema invariants + archetype consistency cross-checks + structural-immutable update) + `verifySchemaOwnership` guard + `mapToSchema` mapper + D-4 prereq exports-map fix. **COMPLETED** 2026-05-19 (`3545ab52..52a49d43`).
- **Step 8.1b** — `lmsSchemaRowApi` (CRUD + 2-pass reorder + parent-kind invariant + payload-discriminator alignment) + `verifySchemaRowOwnership` guard + `mapToSchemaRow` mapper + `TxClient` hoist к `endpoints/lms/_shared/`. **COMPLETED** 2026-05-19. 5 atomic commits + docs commit. Verifications: 661/661 api-server tests + 1609/1609 root tests pass, all gates clean.
- **Step 8.1c** — `SchemaPairing` → `AlternatingGroup` N-ary model redesign (D14): Prisma + `@repo/contracts` slice + `analysis/` sync + seed. Definition layer — no endpoint/guard/mapper (those are 8.1d). **COMPLETED** 2026-05-20. 5 commits `aec22f8a..cf14aab8` + close-out docs commit. Review A / QA A; 1610/1610 root tests; `db:reset`+`db:seed` green. WORKFLOW-001 resolved inline (commit `8c3a701b`).
- **Step 8.1d** — `lmsAlternatingGroupApi` (`create`/`addMember`/`removeMember`/`delete`) + `verifyAlternatingGroupOwnership` guard (new `authz/alternating-group-guards.ts`, REVIEW-I3 closure via own-file axis — `lms-guards.ts` byte-identical) + `mapToAlternatingGroup` mapper + `addMember`/`removeMember` contract schemas + `.max(24)` on `createAlternatingGroupSchema.schemaIds` + D-A4 scope expansion (group-aware `lmsSchemaApi.delete`). **COMPLETED** 2026-05-20. 6 commits `a2e261e8..66626a11` + close-out docs commit. Review APPROVE / QA PASS; 1670/1670 root tests; 38 adversarial attacks attempted, 0 exploited.
- **Step 8.2** — Platform HTTP routes for the `Schema` / `SchemaRow` / `AlternatingGroup` api slices: 10 Next.js App Router `route.ts` handlers over the 12 write methods + contract route-param / `z.union`-widened reorder request schemas. Composition mirrors Step 7.2 (Block). D-8.2-1..7 ratified (D-8.2-7 = `z.union` over `superRefine`, mid-execution escalation). **COMPLETED** 2026-05-20. 7 code/test commits `499b11cb..716c95f2` + prompt/ratify/output docs. Review APPROVED / QA Score A; 1680/1680 root tests; scope confined (no `api-server` / `api-routes` / Prisma touch).

## Pending — Step 8 infrastructure (pre-anchor, untouched по задаче)

Backend plumbing — coach UI surface не materialise-ится здесь; walkthrough stubs не добавляются per «untouched» constraint. Thesis для каждого включает walkthrough параграф per [[coach-walkthrough-gate]] на момент написания.

- **Step 8.3** — Platform client API + hooks (Schema + SchemaRow + AlternatingGroup). `/feature small` mirror Step 7.3.
- **Step 8.3.5** — `schemas[]` read-embed в `blockSchema` (bounded recursion safe per domain §1.5 sub.kind=atomic invariant). `/feature small` mirror Step 7.3.5.
- **Step 8.3.6** — SchemaRow `@@unique([schemaId, order])` + reorder two-pass (simple mirror Step 7.3.6). `/feature small`.
- ~~**Step 8.3.7-pre**~~ — WORKFLOW-001 fix per D13. **DROPPED 2026-05-20** — WORKFLOW-001 resolved inline in Step 8.1c (commit `8c3a701b`, D13 path (b)); deterministic collision no longer reproduces, `pnpm test` green on `db:reset`+`db:seed`. See `log/step-08.1c.md`.
- **Step 8.3.7** — Schema partial-unique constraint: `schemas_block_top_order` partial index в `apply-sql-checks.ts` WHERE parent_schema_id IS NULL + `@@unique([parentSchemaId, order])` Prisma DSL + reorder two-pass с dual scope semantics. `/feature small`, apply-sql-checks.ts touch.

## Pending — Step 8.4 (anchor: first coach-visible Schema editor)

- **Step 8.4** — ArchetypePicker UI shell + Schema CRUD wire-up в plan-detail + первые **2 archetypeParams форм hand-rolled** (`n-rounds` + `amrap-flat`) + **RestSpec sub-editor** (n-rounds имеет optional `rest` field — `archetypeRoundsSetsParamsSchema.rest: restSpecSchema.optional()` — RestSpec editor впервые здесь, reused в Step 9.2 REST rowKind + archetype expansion 8.13/8.14/etc). First coach-visible Schema editor end-to-end. `/feature` full.
  - **Counter**: 2/34 archetypes done.
  - **Walkthrough**: Денис открывает плановый день, тапает «add schema» в блоке тренировки, видит ArchetypePicker dropdown с 34 опциями архетипов (большинство grey-out "coming soon", 2 активных: `n-rounds`, `amrap-flat`). Выбирает `n-rounds` — видит форму: «rounds count» (exact/range/count×reps), «reps per set», optional rest interval (RestSpec sub-editor: raw «90 sec» + parsed scope). Заполняет «5 rounds × 8 reps, rest 90 sec», сохраняет — schema renders в block с этим header'ом. Body всё ещё пустой — заполняется в Step 9 (row editor next).

## Pending — Step 9.1..9.11 — SchemaRow editor (9 rowKinds + 7 composite VOs)

> **Executes immediately after anchor 8.4, before archetype expansion 8.5..8.20.** Row editor работает внутри любой schema независимо от archetype (rows живут в schema body; archetype определяет structure/header, не row mechanics). После 8.4 + Step 9 тренер имеет полностью рабочий schema+row editor для 2 archetypes — первый genuinely usable продукт.

Pace: composite VO editors ship paired с first rowKind that consumes them (foundation-with-real-consumer principle — no isolated infrastructure sub-steps). 9 rowKind variants split по complexity.

**Composite VO scheduling decision (codified)**: composite editors ship **paired с rowKind / archetype that first consumes them in real coach use**, NOT as standalone «foundation-only» sub-steps. Обеспечивает walkthrough quality (editor виден в context) + ESLint headroom (no orphan exports). RestSpec — exception: впервые в 8.4 anchor (n-rounds rest), reused here в 9.2.

- **Step 9.1** — **STANDALONE_LOAD rowKind + LoadEditor composite + WeightEditor sub-composite**. LoadEditor: 5 kinds discriminated (absolute / percentage / bodyweight / without_weight / unspecified); WeightEditor (внутри absolute): 8 variants (single / dual / single_arm / compound_device / split_tier / dual_value / with_asymmetric_arm / with_depth_modifier). `/feature` full.

  - **Counter**: 1/9 rowKinds + 1/7 composite VOs (Load).
  - **Walkthrough**: Денис в созданной `n-rounds 5×5` schema добавляет STANDALONE_LOAD row для применения load к preceding rows. «add row» → «standalone load» из row-kind menu (8 опций, REST_SLOT internal). Видит LoadEditor (5 kinds dropdown); выбирает «absolute» → WeightEditor с 8 variant tabs. Picks «single_arm», вводит «32 kg», scope «applies_to_all_preceding_rows». Schema renders row с load annotation.

- **Step 9.2** — **REST + INNER_LADDER_MARKER + STANDALONE_URL rowKinds** (3 simple rowKinds batch). REST reuses RestSpec sub-editor from 8.4. `/feature`.

  - **Counter**: 4/9 rowKinds.
  - **Walkthrough**: Денис добавляет REST row между упражнениями («90 sec rest») — raw input + auto-parsed scope dropdown (между раундами / сетами / интервалами). Затем INNER_LADDER_MARKER в schema: chip-array «[10, 8, 6]» (marker для associated exercise row). Затем STANDALONE_URL для warm-up видео: url input + wrapped checkbox + appliesTo dropdown.

- **Step 9.3** — **EXERCISE (atomic form) + RepNotationEditor + SideEditor + exerciseForm picker shell**. exerciseId picker from library + RepNotation composite (7 kinds: count / range / unit_bound / max / implicit / total_flag / compound_rep_unit) + Side composite (4 kinds: each_leg / each_arm / explicit_split / alternating) + reuses LoadEditor from 9.1. **Largest single sub-step** (3 composite VOs ship — concern #2; kept single, см. adversarial section). `/feature` full.

  - **Counter**: 5/9 rowKinds + 3/7 composite VOs (Load reused; RepNotation, Side added).
  - **Walkthrough**: Денис добавляет exercise row «Bulgarian split squat 3×8 each leg @ 60% 1RM». «add row» → «exercise». Видит exerciseForm tabs (atomic/compound/cyclical/sandwich/or_alternative/placeholder_ref) — atomic. Picks Bulgarian Split Squat из library. RepNotationEditor: kind dropdown 7 опций, «count», вводит «8». Side editor: «each_leg». Load editor (from 9.1): «percentage», value=60, reference=«self». Saves — row renders с full annotation.

- **Step 9.4** — **EXERCISE (compound form) + CompoundRowEditor composite**. Compound = multi-exercise compound row. Editor: array of (exerciseId + reps + optional load + optional side) elements (min 2). Reuses 9.3 composites. `/feature`.

  - **Counter**: 5/9 rowKinds (EXERCISE — form variant added).
  - **Walkthrough**: Денис создаёт compound «30 sec PLANK + 30 sec LEFT PLANK + 30 sec RIGHT PLANK». В EXERCISE row editor forme tab → «compound». CompoundRowEditor: «add element» × 3, каждый = exercise picker + repNotation (unit_bound «30 sec») + optional load/side + shared modifiers section. Saves.

- **Step 9.5** — **EXERCISE (cyclical + sandwich forms)** + reuse composites. Cyclical = primary/secondary pair с cycles array; Sandwich = opening/middle/closing trio. `/feature`.

  - **Counter**: 5/9 rowKinds (EXERCISE — forms added).
  - **Walkthrough**: Денис создаёт cyclical «squat + jump (2 squats then 1 jump, 5 cycles)». Forme → cyclical: primary picker (squat) + secondary (jump) + cycles array editor. Альтернативно sandwich «pull-up → ring-row → push-up»: opening/middle/closing pickers + reps per element.

- **Step 9.6** — **EXERCISE (or_alternative + placeholder_ref forms)**. or_alternative = primary-vs-alternative pair. placeholder_ref = reference к existing placeholder row. `/feature small`. All 6 exerciseForm forms complete.

  - **Counter**: 5/9 rowKinds (EXERCISE forme variants complete).
  - **Walkthrough**: Денис создаёт «(strict pull-up) OR (banded pull-up)». Forme → or_alternative: primary picker + alternative picker + purpose dropdown (scaling / equipment_substitution / injury_modification). Затем placeholder_ref форма для row referring к ABS placeholder.

- **Step 9.7** — **REP_DEFINITION rowKind + CompoundRepEditor composite**. CompoundRepDefinition 2 forms (curly_brace + inline_equality). Reuse via EXERCISE row-level `compoundRep` field. `/feature`.

  - **Counter**: 6/9 rowKinds + 4/7 composite VOs (CompoundRep).
  - **Walkthrough**: Денис создаёт «5 reps = 1 composite rep [ 1 HS walk + 2 strict HSPU ]». REP_DEFINITION row → CompoundRepEditor (inline_equality): totalReps=5 + composition «[HSwalk×1, HSPU×2]». Reuse curly_brace form в EXERCISE row's `compoundRep` field.

- **Step 9.8** — **FOOTNOTE rowKind**. Marker + target + content (compoundRow reuse from 9.4) + optional typeLabel. `/feature small`.

  - **Counter**: 7/9 rowKinds.
  - **Walkthrough**: Денис добавляет footnote «_каждый раунд: 30 sec PLANK + side variations». Form: marker (_ / \*\*), target (each_round / each_set / each_typed_round), content = CompoundRowEditor. Footnote renders ниже schema body.

- **Step 9.9** — **PLACEHOLDER rowKind + PerSetSubstitutionEditor composite**. placeholderKind enum + text + optional perSetAssignments + optional pairedConcreteRowId. `/feature`.

  - **Counter**: 8/9 rowKinds (REST_SLOT auto-materialized, не в add-row menu per Coach-OQ-2). All visible rowKind editors shipped.
  - **Walkthrough**: Денис создаёт placeholder «ANY exercise for ABS». placeholderKind dropdown (muscle_group_reference / purpose_category / coach_choice_slot) + text. Optional PerSetSubstitutionEditor (set 1 = sit-ups, set 2 = hollow holds). Renders с dashed-border indicator.

- **Step 9.10** — **Row-level Tempo + Media composites enrichment on EXERCISE**. TempoModifier (5 mechanisms: pauseInUp / perNthRepPause / slowEccentric / holdAfterLast / fullTempo 4-digit) + MediaReference (url + position + label + appliesTo). `/feature small`.

  - **Counter**: 6/7 composite VOs (Tempo + Media).
  - **Walkthrough**: Денис уточняет EXERCISE row «Bench Press 5×5 @ 80%»: opens row edit → advanced section с TempoEditor (fullTempo «3-0-1-0») + MediaEditor (demo video url, position=inline). Row re-renders с tempo annotation + video thumbnail.

- **Step 9.11** — **Row-level Intensity (reuse Block Intensity editor from Step 7.5) + Sequence indicator + Position equipment modifier**. Row-level Intensity = same component as Block scope. Sequence indicator + Position enum (11 values). `/feature small`. **Full Step 9 coverage.**
  - **Counter**: 7/7 composite VOs (Intensity reused; Sequence + Position complete). 9/9 rowKinds.
  - **Walkthrough**: Денис добавляет row-level intensity override «95% 1RM @ RPE 9.5» на last working set. Intensity editor (same UI as Block scope — RPE + effortPercent). Sequence dropdown (working_set / warm_up / back_off) + Position enum (FROM_BOX для box squat). Row renders с full metadata stack.

## Pending — Step 8.5..8.20 archetype expansion (32 remaining; full D3 coverage)

> **Executes after Step 9.** Каждый archetype в этой секции стартует с готовым row editor — walkthrough демонстрирует и archetype params form, и заполнение body реальными упражнениями.

Pace: 1-4 archetypes per sub-step. Group batching по UI shape similarity.

### Ladder family — 4 archetypes (chip-array input shared)

- **Step 8.5** — Ladder family batch (4): `ladder-descending`, `ladder-ascending`, `ladder-vertex-down-pyramid`, `ladder-spike`. Shared UI = `steps: array<positiveInt>` chip input. `/feature`.
  - **Counter**: 6/34.
  - **Walkthrough**: Денис выбирает `ladder-descending`, видит chip-array input «steps», печатает «21, 15, 9» (классический 21-15-9). Кладёт в body 2 exercise rows (thrusters, pull-ups) через row editor. Schema renders «21→15→9 thrusters / pull-ups». Затем `ladder-vertex-down-pyramid` — та же форма, другая визуализация header.

### Parallel-ladders family — 3 archetypes (nested chip-array)

- **Step 8.6** — Parallel-ladders batch (3): `parallel-ladders-descending`, `parallel-ladders-mixed-direction`, `parallel-pyramids`. Shared UI = repeating `parallelLadderEntry`: steps array + optional `direction` (asc/desc) + optional `pairedWithInnerRowId`. `/feature`.
  - **Counter**: 9/34.
  - **Walkthrough**: Денис выбирает `parallel-ladders-mixed-direction`, «Add ladder» — row с steps chip-input + direction toggle. Ladder #1 [10,8,6] asc, ladder #2 [5,10,15] desc. Кладёт exercise rows + связывает через INNER_LADDER_MARKER. Видит две параллельные дорожки в preview.

### Empty-params batches — 7 archetypes (one-tap UX, no params form)

- **Step 8.7** — Empty-params batch 1 (4): `single-line-bare`, `single-line-with-then-connector`, `flat-list-headerless`, `placeholder-body`. UI = pick → save (no params form; optional header/intensity/notes shared fields). `/feature small`.

  - **Counter**: 13/34.
  - **Walkthrough**: Денис создаёт `single-line-bare` schema — one-tap save, пустая schema готова. Через row editor кладёт одно упражнение. Затем `flat-list-headerless` — несколько exercises без header.

- **Step 8.8** — Empty-params batch 2 (3): `pull-ups-dips-cycle`, `practice-list`, `url-only-body`. Same one-tap UX. `/feature small`.
  - **Counter**: 16/34.
  - **Walkthrough**: Денис добавляет `practice-list` (набор упражнений на технику) — one-tap, заполняет body exercise rows. Затем `url-only-body` для «warm up video» — one-tap, body = один STANDALONE_URL row.

### Simple-numeric batch — 3 archetypes (1-2 scalar inputs)

- **Step 8.9** — Simple-numeric batch (3): `time-window-outer` (HH:MM start/end), `single-line-total-counter` (boolean `totalFlag`), `emom-nested-per-minute` (`durationMin` + optional `rounds`). `/feature small`.
  - **Counter**: 19/34.
  - **Walkthrough**: Денис программирует `time-window-outer` «утренний spin 7:30-8:00»: two HH:MM inputs. Затем `emom-nested-per-minute`: «duration min» + optional «rounds» — «12 min EMOM», заполняет body упражнениями per minute.

### Moderate batch — 3 archetypes (mixed shape)

- **Step 8.10** — Moderate batch (3): `alternating-sets` (setEnumeration array — schema-to-schema linking is the separate `AlternatingGroup` entity per D14, UI deferred D11), `named-themed-sets` (count exactOrRange + theme string), `run-distance` (modality=RUN + optional distance unit/value/range). `/feature`.
  - **Counter**: 22/34.
  - **Walkthrough**: Денис создаёт `alternating-sets` — set enumeration chips «5,5,5» (связывание серий в alternating-группу — отдельный flow поверх `AlternatingGroup`, D11). Затем `run-distance` km value=5 → «5 km RUN». Затем `named-themed-sets` count=3 theme=«Activation».

### Composite-intervals simple — 2 archetypes (3 numeric fields)

- **Step 8.11** — Composite-intervals simple (2): `composite-intervals-work-rest-fixed` (intervalsCount + workMin + restMin), `composite-rolling-rounds` (everyNthMin + rounds + totalMin). `/feature small`.
  - **Counter**: 24/34.
  - **Walkthrough**: Денис программирует HIIT — `composite-intervals-work-rest-fixed` «8 × 1 min work / 1 min rest», заполняет body. Затем `composite-rolling-rounds` «every 3 min × 10 rounds».

### Composite-intervals moderate — 2 archetypes (4 fields + ref / seed)

- **Step 8.12** — Composite-intervals moderate (2): `composite-intervals-work-rest-progressive` (sets + workMin + offMin + `progressiveSeed` string), `composite-intervals-on-off-max-tail` (intervals + onMin + offMin + `tailExerciseId` picker). `/feature`.
  - **Counter**: 26/34.
  - **Walkthrough**: Денис создаёт `composite-intervals-on-off-max-tail` finisher «5 × 30s on / 30s off + max burpees». intervals/onMin/offMin inputs + exercise picker для tail (Burpee).

### Composite-rounds-with-rest — 1 archetype (RestSpec reuse from 8.4)

- **Step 8.13** — `composite-rounds-with-rest` (count: exactOrRange + rest: restSpec — RestSpec editor reused from 8.4 anchor). `/feature small`.
  - **Counter**: 27/34.
  - **Walkthrough**: Денис создаёт «3 rounds with 2 min rest». count input + RestSpec editor (reused). Заполняет body, видит rest annotation в rendering.

### Composite-intervals-then-rounds — 1 archetype (exerciseForm + repNotation reuse from Step 9.3)

- **Step 8.14** — `composite-intervals-then-rounds` — embeds exerciseForm picker + RepNotation editor (preamble exercise + reps), оба reused from Step 9.3. Two-phase preamble→rounds form. `/feature`.
  - **Counter**: 28/34.
  - **Walkthrough**: Денис программирует «warm-up: 10 burpees, then 5 rounds for time». Form: intervalsCount/restMin/innerRounds + preamble exercise picker + preamble reps (RepNotation reused). Two-phase visualization.

### EMOM sub-minute-slot — 1 archetype (SlotSpec composite)

- **Step 8.15** — `emom-sub-minute-slot` — SlotSpec composite editor (internal sub-minute slot mechanic). `/feature small`.
  - **Counter**: 29/34.
  - **Walkthrough**: Денис создаёт EMOM с sub-minute slots (30s windows). SlotSpec form (slot duration + count). Body — REST_SLOT auto-materialized per Coach-OQ-2 (8.1b ratify).

### Named-exercise-program — 1 archetype (StagedProgram composite VO)

- **Step 8.16** — `named-exercise-program` — exerciseId picker + StagedProgram composite editor (drop-set / wave / cluster stages). `/feature`.
  - **Counter**: 30/34.
  - **Walkthrough**: Денис программирует «Bench press drop-set: 80%×5 → 75%×8 → 70%×12». Picks Bench Press, StagedProgram editor: 3 stages с reps + load% per stage. Named header «Bench Press Drop Set».

### Super-set — 1 archetype (pair-of-rows reference)

- **Step 8.17** — `super-set` — `pairs: [{label, schemaRows: cuid[]}]` array editor + restBetweenPairs (RestSpec reuse) + rounds. Cross-row reference UX. `/feature`.
  - **Counter**: 31/34.
  - **Walkthrough**: Денис создаёт super-set «squat → push-up alternating». Сначала кидает 2-3 exercise rows в body (row editor готов), потом группирует в pairs: «add pair» + label («Lower») + multi-select rows. rounds count.

### Nested family — 3 archetypes (sub-schema editor UX surface; row editor готов → walkthrough complete)

Вводят sub-schema editor surface (NESTED schema body содержит sub-schemas вместо rows). Row editor готов (Step 9 завершён) → walkthrough демонстрирует полный flow с заполнением sub-schema bodies.

- **Step 8.18** — `nested-rounds-over-rounds` — outer rounds wrapping inner schemas. Sub-schema editor surface first ship. `/feature`.

  - **Counter**: 32/34.
  - **Walkthrough**: Денис создаёт «5 rounds where each round = (super-set + EMOM)». `nested-rounds-over-rounds` → outerCount «5» + sub-schema slots. «add sub-schema» × 2 → вложенные ArchetypePicker'ы (ATOMIC/HEADERLESS subset). Sub-schema #1 = `n-rounds`, #2 = `amrap-flat`. Заполняет каждую sub-schema body упражнениями через row editor. Полный nested rendering.

- **Step 8.19** — `nested-rounds-over-parallel-ladder` — outer rounds wrapping parallel-ladder sub-schema. `/feature small`.

  - **Counter**: 33/34.
  - **Walkthrough**: Денис создаёт outer 5-rounds, inner = parallel-ladder ([10,8,6] pull-ups paired [5,4,3] HSPU). Заполняет sub-schema rows + markers.

- **Step 8.20** — `nested-composite-rounds-over-ladder` — outer composite rounds (with rest) wrapping ladder sub-schema. `/feature small`.
  - **Counter**: 34/34. **All archetype params forms hand-rolled.**
  - **Walkthrough**: Денис создаёт outer composite-rounds-with-rest, inner = ladder. Two-tier UX: outer rest editor + sub-schema ladder editor + row body filling.

## Step 10 — End-to-end smoke + workflow close-out

- **Step 10** — End-to-end coach happy path smoke-test + cleanup + workflow close-out. Manual scenario validated by user; defects fixed via `/fix` loop; workflow completion criteria per WORKFLOW.md verified. **Coach validation gate ([[training-domain-validation-gate]]) DEPRECATED 2026-05-19** — no rip-eject contingency planning; scope = full реализация domain model описанной в `analysis/artifacts/`; что после — separate workflow. `/feature small` или direct cleanup.
  - **Walkthrough**: Денис проходит полный coach happy path — создаёт plan «Strength block 12 weeks», программирует первую неделю (3 sessions: Lower / Upper / Conditioning), наполняет blocks разными archetypes (n-rounds squat warm-up + amrap-flat metcon + composite-rounds-with-rest bench progression + named-exercise-program drop set), заполняет schema bodies упражнениями со всеми 9 rowKind variants. Видит rendering всех 34 archetype + 9 rowKind работающих. Никаких console errors / failed saves / lost data.

## Calendar / scope estimates

- **Execution order**: ~~8.1c~~ (done) → ~~8.1d~~ (done) → ~~8.2~~ (done) → 8.3 → 8.3.5 → 8.3.6 → ~~8.3.7-pre~~ (dropped) → 8.3.7 → **8.4 anchor** → **9.1..9.11 row editor** → **8.5..8.20 archetype expansion** → 10.
- Step 8 sub-steps total: **28** (7 completed + 4 infrastructure + 1 anchor + 16 archetype expansion). 8.1c split into redesign (8.1c, done) + api (8.1d, done); 8.3.7-pre dropped — net 0.
- Step 9 sub-steps total: **11** (9.1..9.11).
- Step 10: 1.
- Pace 2-5 days per sub-step → ~3-4 months end-to-end realistic. Empty-params batches ~1 day each; EXERCISE atomic 9.3 ~5-7 days (3 composite VOs).

## Adversarial review concerns (codified per задаче)

1. **Composite VO ship-with-first-consumer** — LoadEditor lands в 9.1 STANDALONE_LOAD (редкая coach affordance — ~2 occurrences sample) before 9.3 EXERCISE consumes его (149 exercises × many rows). **Resolved**: 9.1 STANDALONE_LOAD = isolated UX, cleanest first-validation surface для LoadEditor (one rowKind, no row-level scalars); 9.3 EXERCISE consumes proven editor. Ordering locked.

2. **Step 9.3 EXERCISE atomic = largest single sub-step** — ships RepNotation (7 kinds) + Side (4 kinds) + reuses Load (9.1) = 3 composite editor surfaces. **Resolved**: keep 9.3 single — atomic exercise без reps = useless coach affordance; split = artificial granularity hurting coach progression. Ordering locked.

3. **Step 9 vs archetype expansion ordering** — **RESOLVED 2026-05-20 (full interleave)**: Step 9 (row editor) executes after anchor 8.4, before archetype expansion 8.5..8.20. Rationale: пустой archetype без row editor для тренера бесполезен; 8.4 + Step 9 = первый genuinely usable продукт (2 рабочих archetype с реальными упражнениями); каждый archetype в expansion 8.5+ сразу имеет готовый row editor → walkthrough complete (params form + body fill). Side-effect bonus: nested archetypes 8.18-8.20 ship after row editor — sub-schema bodies fillable, nested walkthrough full not partial.
