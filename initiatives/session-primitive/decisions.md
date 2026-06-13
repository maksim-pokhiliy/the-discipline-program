# session-primitive — decisions

D-numbered ratified decisions. Step-level calls that don't merit a full ADR live here; cross-initiative architecture calls go to `docs/adr/`. **Promote here at every gate** — this file is the SSOT for "why."

**Status legend:** `RATIFIED` (decided + acted) · `OPEN` (awaiting owner ratification — do not execute past it) · `SUPERSEDED` (replaced — kept for the trail).

**Legitimacy lens (supersedes four-projection for this initiative):** the CHANNELS RULE (D-5). Four-projection invariance judged primitives against projections that don't exist (EXECUTES/ANALYTICS) and kept birthing inert stored surface — D-CADENCE ratified `window` days before ADR-0039 deleted it. Here a primitive is judged only against the projections that are LIVE (coach WRITES, human READS); hypothetical projections get a deferred note, never a stored field.

## Index

| ID                          | Topic                                                                                | Status     |
| --------------------------- | ------------------------------------------------------------------------------------ | ---------- |
| D-1 SCOPE                   | Target = the session primitive; fixed floors Session→Block→Schema→Row                | RATIFIED   |
| D-2 BOX                     | Relations = explicit Group boxes; opaque coach-owned label; no derivation            | RATIFIED   |
| D-3 NO-RECURSION            | Sub-schemas die; no "group" schema-type tile; no graph                               | RATIFIED   |
| D-4 NO-TYPED-REL            | No typed relation kinds (no parallel\|choice\|superset enum); text label only        | RATIFIED   |
| D-5 CHANNELS                | Notation → structure \| typed field \| human text \| dropped syntax                  | RATIFIED   |
| D-6 GRID                    | `primitive-spec.md` grid = the per-notation disposition (statuses inside)            | RATIFIED   |
| D-7 PROCESS                 | Orchestrator/runner model: план → промпт → ревью; /feature wrap; git review          | RATIFIED   |
| D-8 JIT-FREEZE              | Implementation starts now; OPEN items close just-in-time before their wave           | RATIFIED   |
| D-MARKER-DEATH              | `INNER_LADDER_MARKER` dies; rep-scheme ladder = one-row ladder-schema in Group       | RATIFIED   |
| D-PLAQUE                    | Plaque = render vocabulary, no stored node; rest single-carrier; notes stack         | RATIFIED   |
| D-POSITION                  | `Position` enum + column die into ROW NOTES; no library                              | SUPERSEDED |
| D-CHIPS                     | "Chips as a mechanism" dissolved — notes cover it; chip = MUI render word            | RATIFIED   |
| D-MODIFIER                  | Row modifiers = coach-owned library entity; multi-ref on rows; 3-layer boundary      | RATIFIED   |
| D-FLOORS                    | Per-floor settings map; block intensity+timeCap→gone; intensity only on schema       | RATIFIED   |
| D-ROW-GRAMMAR               | One row kind (exercise); REST/PLACEHOLDER/REST_SLOT die→catalog natures; sets free   | RATIFIED   |
| D-LOAD-FINAL                | load+weight final; exotics die; single/single_arm merge; byProfile=label-map list    | RATIFIED   |
| D-TEMPO                     | 4-digit typed (X allowed); verbal tempo forms → modifiers                            | RATIFIED   |
| D-EXEC-DEFER                | Execution/scoring semantics (straight-into, for-time, score-on-N) = notes till P4    | RATIFIED   |
| D-HEADER-KEEP               | Schema header stays as a field; F-HEADER = UX parity only (in-group ≡ standalone)    | RATIFIED   |
| DR-W1-1 BOX-RENDER          | Parallel parent → `AccentGroupCard` box gated by the live one-predicate              | RATIFIED   |
| DR-W1-2 CHECKBOX            | «Group into one box» = submit-branch flag; unchecked → N non-atomic flat creates     | RATIFIED   |
| DR-W1-3 HEAD-DEDUP          | Boxed parent: chip+title suppressed; `header` shown once in the box label zone       | SUPERSEDED |
| DR-W1-4 COPY                | Checkbox copy = English "Group into one box" (Gate A)                                | RATIFIED   |
| DR-W1-5 INDEP-VALID         | Unchecked path validates ladder steps client-side, coach-message parity (Gate B)     | RATIFIED   |
| DR-W2-1 GROUP-OWN           | `SchemaGroup` block-owned; SetNull dissolution; no `order` column                    | RATIFIED   |
| DR-W2-2 ARR-DEATH           | Arrangement axis dies whole; `composition = { repetition?, rest? }`                  | RATIFIED   |
| DR-W2-3 LEAF-KILLS          | Ratified Grid A/B leaf kills (reps/load/weight/media/schema-row/compounds)           | RATIFIED   |
| DR-W2-4 IDEM-SCOPE          | D4 was ~90% pre-built; only client stable-key threading added; base = `draft.id`     | RATIFIED   |
| DR-W2-5 PAIRED-KILL         | `pairedConcreteRowId` premise false (inert, 0 producers) → killed                    | RATIFIED   |
| DR-W2-6 BLK011              | block-011 rounds-over-rounds → 1-member Group "3 rounds:"                            | RATIFIED   |
| DR-W2-7 BLK015              | block-015 interval-then-rounds → two sibling schemas (NOT a Group)                   | RATIFIED   |
| DR-W2-8 ORDER-UNIQ          | Premise false → full unique landed at review via the raw-SQL check layer             | SUPERSEDED |
| DR-W2-9 CONTIGUITY          | Contiguity is a server invariant (`assertGroupMembersContiguous`)                    | RATIFIED   |
| DR-W2-FORK-1                | `interleaveOrder` = validated `String`, not a Prisma enum (Gate A)                   | RATIFIED   |
| DR-W2-FORK-2                | Group-create response embed = `{ group, members }` (flat `SchemaWithBody[]`)         | RATIFIED   |
| DR-W2-FORK-3                | Load `byProfile` reuses the dual-value two-input layout (Gate A)                     | RATIFIED   |
| DR-W2-FORK-4                | `interleaveOrder` editing moves OFF the schema ONTO the Group box meta               | RATIFIED   |
| DR-W2-FORK-5                | Seed block-011/015 re-expression calls (the 2 extra non-parallel shapes)             | RATIFIED   |
| DR-W2-FORK-6                | `buildBlockItems` lives in contracts (the new one-predicate)                         | RATIFIED   |
| DR-W3-1 IDEM-DASH           | Idempotency key separator `-`; format-pin test imports the REAL regex                | RATIFIED   |
| DR-W3-2 PROTO-LOCAL         | Proto group card built platform-local; `AccentGroupCard` dropped, not modified       | RATIFIED   |
| DR-W3-3 SEG-CONTROL         | Interleave editing = platform-local `.seg`; same `PUT /groups` mutation              | RATIFIED   |
| DR-W3-4 ADD-TRACK           | "Add track" = instant `POST /schemas` + `groupId` + default ladder (FORK-1a)         | RATIFIED   |
| DR-W3-5 DEL-CLIENT          | Delete-group-and-tracks = client-orchestrated sequential `DELETE /schemas`           | RATIFIED   |
| DR-W3-6 ADD-GROUP           | Block-level "Add group" reuses `useCreateGroup` w/ seeded 2-track draft (FORK-4a)    | RATIFIED   |
| DR-W3-7 DRAFT-FLAT          | Recursive draft collapses to `SchemaDraft`/`TrackDraft`/`GroupDraft`; flat           | RATIFIED   |
| DR-W3-8 KIND-CONF           | `ConfirmationModal` gates a DIRTY repetition-kind switch; clean switches silent      | RATIFIED   |
| DR-W3-9 DEMOTE-KEPT         | `should-be-container` + demote hint retyped, NOT deleted (owner follow-up)           | RATIFIED   |
| DR-W3-10 HYGIENE            | Stale fixtures + vestigial contracts exports + caption + seed const rename           | RATIFIED   |
| DR-W3-FORK-2 EXPORT         | `IDEMPOTENCY_KEY_REGEX` barrel-exported from `@repo/api-routes` (additive 1-line)    | RATIFIED   |
| DR-W3-FORK-3 SEED           | Seed const renamed `…FOOTNOTES…`→`…PER_ROUND_MARKERS…` (owner-delegated)             | RATIFIED   |
| DR-W3-REENTRY               | Re-entry guard — narrowed to modal-less buttons by DR-W3-12                          | RATIFIED   |
| DR-W3-11 PTR-COLL           | Mixed-height lists use pointer-first collision (`pointerWithin` → corners)           | RATIFIED   |
| DR-W3-12 MODAL-PAT          | Group confirmations follow the house modal pending pattern; refs removed             | RATIFIED   |
| DR-W4-1 NOTES-JSON          | `notes Json?` `string[]` on EVERY carrier (convert-all incl. Week); one shape        | RATIFIED   |
| DR-W4-2 MOD-WRITE           | Modifier write = `modifierIds[]` set-replace on the row; read embed `modifiers[]`    | RATIFIED   |
| DR-W4-3 ROW-COLLAPSE        | Drop `rowKind`/`rowPayload`; `exerciseId` loose on row (no FK); render-kind inferred | RATIFIED   |
| DR-W4-4 LOAD-COUNT          | `absolute {count:1\|2, kg}` — count an explicit row choice in the load VO            | RATIFIED   |
| DR-W4-5 ONE-WAVE            | Run the WHOLE W4-model in one /feature (no A1/A2 split); batches = the commit units  | RATIFIED   |
| DR-W4-PAIRED                | Kill `explicit_split.pairedRowId` inline (dead sibling-ref, DR-W2-5 cousin)          | RATIFIED   |
| DR-W4-RG-CREATE             | Row-group create wraps EXISTING contiguous rows (`{schemaId, rowIds[]≥2, notes?}`)   | RATIFIED   |
| DR-W4-MAPPER-INPUT          | `mapToSchemaRow`/`…WithBody` input types carry the modifier + rowGroup includes      | RATIFIED   |
| DR-W4-SWB                   | `schemaWithBodySchema` extended to `{schema, rows, rowGroups}` (the `Block.groups`)  | RATIFIED   |
| DR-W4-TEMPO-SHAPE           | `tempoModifierSchema` collapses to `fullTempoSchema` (flat; positions `int\|"X"`)    | RATIFIED   |
| W4E-F1 COACH-MOD            | INCLUDE coach create-on-the-fly modifier (D3 endpoint mirrors admin-create)          | RATIFIED   |
| W4E-F2 NOTES-LIST           | `NotesListEditor` edits `string[]` directly; `notes-list-text.ts` RETIRED            | RATIFIED   |
| W4E-F3 SELECT-GROUP         | Row grouping = select-mode wrap of contiguous rows; add-to-existing OUT              | RATIFIED   |
| DR-W4E-FORM-STATE           | Row form = controlled state object, NOT react-hook-form                              | RATIFIED   |
| DR-W4E-PICKER-LOCAL         | Modifier picker platform-local, generic-prop'd for LABEL-FLOW-UX                     | RATIFIED   |
| DR-W4E-NOTES-LOCAL          | `NotesListEditor` lands platform-local (promotable to `@repo/ui`)                    | RATIFIED   |
| DR-W4E-EXERCISE-LOCK        | `exerciseId` create-only → exercise picker disabled in edit mode                     | RATIFIED   |
| DR-W4E-RG-ORPHAN            | Delete-with-members leaves the empty RowGroup; `buildRowItems` drops it              | RATIFIED   |
| DR-W4E-ROW-REORDER          | Row reorder WIRED (Gate A) — mirror `block-card-body`; `pointerFirstCollision`       | RATIFIED   |
| DR-W4E-W4R-001-CLIENT       | Row-group overlap guard is client-only this wave; server reject deferred             | RATIFIED   |
| DR-W4E-COACH-ISSUE          | Row form surfaces coach-friendly validation (`coach-row-issue`); submit-block        | RATIFIED   |
| DR-W4E-PICKER-MINT-TOLERANT | Create-on-the-fly catches per-mint rejection; keeps selection, no unhandled          | RATIFIED   |
| D7 supersedes DR-W1-3       | In-group schema renders its header identically to standalone (D-HEADER-KEEP)         | RATIFIED   |

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

### D-PLAQUE — the instruction plaque dissolves into render vocabulary; per-case carriers ratified

- **Status:** RATIFIED (2026-06-12, owner — closes the F-PLAQUE follow-up, the W4 design gate).
- **Decision.** The "плашка-инструкция" is APPEARANCE, not a domain entity (owner verbatim: "плашка это про визуальное отображение, т.е. этим словом я пытаюсь описать апиранс элемента, а не его доменное значение"). NO stored plaque primitive. The thin-strip visual stays as the render vocabulary for: the schema rest setting, the cadence `REST_SLOT`, the row-group label zone, and the notes stack. The corpus strip population (~93: rest 71 · connectors 16 · EXAMPLE 4 · only-once 2) resolves per case:
  - **Rest (71 occ / 17 distinct — all reduce to duration × scope):** the schema-level rest setting (the EXISTING edit-modal flow: duration/scope/qualifier — owner: "с этим флоу всё так") is the ONLY carrier. **`RowKind.REST` dies** — it duplicated the axis (the seed used both interchangeably; three carriers for one meaning was the smeared-carrier disease at the leaf). Its `raw` string dies with it (Excel format memory, channel ✕). **ONE rest per schema — multi-rest explicitly rejected for now** (owner: "второго отдыха в схеме сейчас не делаем"); the dual-rest corpus schema (`schema-boundaries.md:2169` — between-sets-until-recovery + 5-min-after-3rd-set on one `3 sets:` schema, ≥2 blocks) expresses its second rule as a note at re-seed. `REST_SLOT` untouched (positional rest in the cadence minute grid — its own ratified grid row).
  - **Connectors `then:` (16):** schema order (re-confirmed; render may draw glue).
  - **`[ EXAMPLE: … ]` (4):** a schema note (see the notes model below).
  - **`ONLY ONCE before METCON` (2):** a SEPARATE schema placed before the metcon — structure via order, NOT a note (owner correction: "это рабочее задание атлету… должно быть добавлено просто как схема"; the Excel annotation existed only to keep the row from multiplying by rounds — the constructor has no such problem). The sequence VO's death carrier is therefore order/structure first; notes only for genuine reading-aid prose (the before/after-BAR-DIPS family).
  - **`x OR y` (3) + per-set substitution (2):** row-level grouping (mechanics below).
- **Notes model (owner-designed).** A note can live on ANY element — block / schema / row / schema-group / row-group — and an element can carry MULTIPLE notes (no count cap: "не вижу причин ограничивать тренера количеством заметок"). Engineering shape: each element's single `notes` text column becomes an ordered list of short texts (no new table, no cross-element refs). Render: a stack of plaques under the owning element.
- **Row-group mechanics.** The mirror of the schema Group one floor down, inside the schema card: CONTIGUOUS member rows, **2+ members** (not exactly 2 — owner: "учесть, что OR может связывать 2+ строки"), schema-owned, opaque coach-editable label ("OR"), membership is the only relation, no typed kinds (D-2/D-4 by symmetry). Gestures mirror the schema-group set (group rows / one-click ungroup keeping the rows / inline label edit). Per-set substitution = the same box (slot row + variant rows under one label). Pixel-level UX rides the W4 design stage.
- **Rationale.** After the grid's own ratified rulings (footnote = ordering, per-set = row-group, TOTAL dead, connectors = order), a stored plaque had ZERO corpus lines left to carry; a free-text plaque row would be the blanket mechanism F-CHIPS already rejected one floor up, at cardinality 0. If a real coach strip ever appears that fits neither a label nor a note, an instruction row kind is an additive re-introduce-fresh (ADR-0038) — cheap to add, expensive to remove (W2/W3 just spent two waves removing such residue).
- **Consequences.** W4 carries the implementation: `RowKind.REST` + `raw` kill (seed rest lines re-express onto the schema setting; the dual-rest block's second rule → note), notes columns → ordered lists (+ notes on both group entities), the row-group entity + editor, the only-once corpus case re-seeded as its own schema. The schema rest setting becomes the single rest carrier; its strip render lands with the W4 editor work.

### D-POSITION — position dies into row notes; no library

- **Status:** SUPERSEDED (2026-06-12, same day — by D-MODIFIER; the owner re-opened position as a MODEL concept and the dictionary/register/write-UX case prevailed). Kept for the trail.
- **Decision.** The `Position` Postgres enum, the `SchemaRow.position` column, the platform `position-editor.tsx` + `formatPosition` die. The corpus "how to execute" strings (`from sofa`/`from box/sofa` 27 incl. word-order variants, `neutral grip` 13, `WITHOUT JUMP` 5, `hold farm carry` 2, `hands on DB`, `WITHOUT BENCH`, `kind of wall balls`) become **row notes** — the D-PLAQUE multi-note model carries them for free (the corpus 2–3-modifier rows = several notes). **NO position library** — the founding-session "library à la Label/Exercise" lean is dropped (owner: "а почему это должно быть чем-то бОльшим чем заметка?").
- **Rationale.** Channel-Ч by the legitimacy lens: nothing machine-reads position (the only consumer is the display-only `formatPosition` text); a library would be storage infrastructure for a hypothetical projection — the exact pattern this initiative kills. Consistent with the owner's per-set ("уникальности ноль") and footnote ("НЕ УНИКАЛЬНАЯ СТРОКА") rulings. **Eyes-open losses, named at ratification:** no autocomplete reuse while typing, no propagating rename — both conveniences, not load-bearing (and history-rewriting renames were argued AGAINST anyway: plans are documents athletes already trained by). If real vocabulary pain surfaces, a library can be layered LATER as pure input-UX over the same note texts (re-introduce-fresh, ADR-0038).
- **Consequences.** W4 carries: the enum + column + `positionSchema`/`POSITIONS` + editor + formatter kills; seed re-expression of `position` values into row notes.

### D-CHIPS — "chips as a mechanism" formally dissolved

- **Status:** RATIFIED (2026-06-12, owner).
- **Decision.** There is NO blanket "attach a free-text chip to anything" mechanism. Owner verbatim: "Chip это вообще компонент из МЮИ, сам по себе значит 'цветную штучку'. механизм 'прицепи текстик' это уже notes на уровне схем и строк, поэтому обсуждать 'чипсы' уже смысла нет." Every channel-Ч item has a concrete per-case home: structure (groups/order) · typed settings (rest) · the catalogs (Exercise/Label) · the notes stack (D-PLAQUE) · opaque box labels. "Chip" survives only as a render word (the MUI component).
- **Rationale.** The founding instinct confirmed: chips-as-mechanism = "костыль который появляется когда кто-то устал дизайнить модель". With D-PLAQUE + D-POSITION every channel-Ч grid row is carried; a generic attach-anything mechanism would re-open the untyped-smear door.

### D-MODIFIER — row modifiers are a coach-owned library entity (supersedes D-POSITION)

- **Status:** RATIFIED (2026-06-12, owner-initiated same-day reversal of D-POSITION: "я бы таки обсудил 'позицию' как часть модели, а не текстик").
- **Decision.** The ex-position concept becomes the **row MODIFIER** (owner's BEM framing): a coach-owned library entity à la Label/Exercise holding the "how to execute" dictionary (`from box / sofa`, `neutral grip`, `without jump`, `hold farm carry`, `hands on DB`, `without bench`, …). A row carries an ordered LIST of modifier REFS — the corpus carries 2–3 on one row, which the single-value enum never could. The `Position` Postgres enum + `SchemaRow.position` column + the enum editor still die (as D-POSITION ruled); only the carrier changes — library refs instead of note texts. Deleting a library entry still in use is REFUSED (Restrict — the Exercise→OneRMRecord precedent); renaming edits the dictionary WORDING, not the prescription (HSPU-from-sofa stays HSPU-from-sofa), so history is not rewritten. `kind of wall balls` (situational clarification, cardinality 1) re-expresses as a NOTE in the seed — a re-expression choice, NOT a system rule: in the live product the coach picks the carrier himself (owner: "это может быть чем угодно, хоть упражнением, если тренер это напишет").
- **The three-layer boundary (ratified).** (1) Machine-READ fields stay TYPED — reps, load, side (side MULTIPLIES volume), tempo pending its own F; (2) dictionary "how to execute" concepts → library modifiers; (3) situational text → notes. A modifier changes HOW the movement is performed, never WHAT is counted — nothing typed may collapse wholesale into the modifier; each candidate runs through this boundary in its own F-topic (tempo → F-TEMPO, weight exotics → F-WEIGHT-EXOTICS).
- **Rationale (why D-POSITION fell in a day).** Its "nothing machine-reads position → plain text" reasoning weighed identity as a convenience. Wrong on three counts: (1) the corpus strings are a DICTIONARY — one thing in 27 places, identity is a domain fact, not a projection; (2) modifiers live in the PRESCRIPTION register (the athlete must execute them), not the note register — mixing them buries the mandatory in the advisory; (3) the WRITE projection is live by the initiative's own legitimacy lens — typing the same string 27 times per plan is coach-daily-UX pain №1, and the searchable create-on-the-fly picker the owner plans for Labels (LABEL-FLOW-UX) makes the catalog pattern shared, killing the marginal-infrastructure objection. Process note, recorded honestly: the orchestrator optimized for agreement twice (brought the library on weak grounds, then folded it instead of articulating the dictionary/register/write-UX case).
- **Consequences.** W4 carries: the modifier library entity (contracts + CRUD + the searchable create-on-the-fly picker in the row editor — component shared with LABEL-FLOW-UX) · multi-ref storage on rows (mirror the Label assignment pattern; final shape at W4 design) · the enum/column/editor kills · seed `position` values → library entries + refs. Entity/table naming rides the W4 prompt.

---

## W4 design ratifications (D-FLOORS … D-HEADER-KEEP) — the row grammar + per-floor settings

The 2026-06-12 floor-by-floor session (the owner walked every floor top-down; the orchestrator brought the evil-CrossFit fixture A–E as the acceptance stress test). These six close the entire W4 leaf design — the grid reaches zero OPEN rows. Implementation rides the W4 `/feature` prompt (model + coach-platform page), then the catalog pass, then the e2e (orchestrator writes evil workouts, owner builds them by hand).

### D-FLOORS — what each floor settings, top to bottom

- **Status:** RATIFIED (2026-06-12, owner floor-by-floor review).
- **Decision.** Per-floor settings map:
  - **Day** — Labels + Notes.
  - **Session** — Labels + Notes.
  - **Block** — Labels (multiple) + Notes. **Intensity AND timeCap LEAVE the block** (intensity → schema, the sole carrier; timeCap → expressible as the schema's `repetition.timeCap` — closes F-BLOCK-TIMECAP). A block is a NAMED PART of a session (warm-up / strength / metcon / accessory…), not a carrier of load.
  - **Schema Group** — membership + interleave (round↔track) + Notes. The free-text `label` column DIES → notes (first note renders in the box header zone). NO intensity (each track carries its own load).
  - **Schema** — repetition + rest + **intensity (moved down from the block, the sole carrier)** + header (kept, D-HEADER-KEEP) + Notes.
  - **Row Group** — the mirror of Group one floor down (contiguous 2+ members, `label` → notes).
- **Rationale (owner).** "промоутить на все дочерние схемы все настройки — скорее ограничение": a block promoting load/intensity/timeCap onto every child forbids per-exercise / per-track load (strength: different load per movement; parallel ladders: each its own; interval run: per-interval). So those settings drop to the schema, where load actually varies. The group's hand-written `label` (against the existing Label pattern, semantically a note) folds into the notes stack (D-PLAQUE) — one mechanism, not two.
- **Consequences.** W4: Block loses `intensity` + `timeCap` columns (seed re-express — block-055 `70% EFFORT` → schema intensity; `PRACTICE [5-10 min]` → schema `repetition.timeCap`); `SchemaGroup.label` column → notes; the row-level intensity override is removed (intensity is schema-only).

### D-ROW-GRAMMAR — one row kind; the kind is inferred, not picked; sets is a free row property

- **Status:** RATIFIED (2026-06-12, owner).
- **Decision.** A row IS an exercise — ONE kind. The `RowKind` discriminator REST + PLACEHOLDER + REST_SLOT all die → they become a NATURE of the catalog record (`concrete | placeholder | rest`); the row's render-kind is INFERRED from the chosen exercise's nature, never picked as a first step (the first modal step is the exercise select). The exercise-form section dies: `atomic` stays; `compound` + `or_alternative` + `placeholder_ref` → a row-group (D-PLAQUE — relations are boxes, on rows as on schemas). **`sets`** becomes a free row property ("repeat THIS row N times in a row, then the next row") with NO "only in a schema without repetition" constraint — a row must not know about its schema. The EMOM minute slot = a top-level element of the row list (a row OR a box); a REST minute = a row carrying the rest-natured exercise.
- **Rationale (owner caught the smell twice).** REST and PLACEHOLDER as ROW KINDS each made the row know its schema context, and each duplicated a carrier that already exists: `placeholderFlag` is already a catalog property (verified — the picker filters on it, the renderer dashes it), and REST is "тоже задание" = a rest-natured exercise. Collapsing both into catalog-nature makes the kind inferred and the first step uniform (pick an exercise — concrete movement, ABS slot, or Rest). `sets` cycles ONE row (A,A,A→B,B,B); `repetition.count` cycles the row LIST (A,B→A,B) — different axes, no overlap, no schema-awareness needed.
- **Consequences.** W4: the row-kind collapse (REST/REST_SLOT/PLACEHOLDER row kinds die); the exercise-form union → atomic-only (compound/or_alternative/placeholder_ref → the row-group entity + editor); a `sets` field on the row. The full nature enum (`concrete|placeholder|rest`) is formalized in the CATALOG pass (out of the W4 model boundary, per charter); W4 may interim-carry it via the existing `placeholderFlag` + a seed Rest-natured exercise. The row-kind discriminator may survive internally as an INFERRED render hint, never an authored field.

### D-LOAD-FINAL — load + weight final shape; the implement/count/kg split

- **Status:** RATIFIED (2026-06-12, owner — count mechanic confirmed).
- **Decision.** The weight VO fused three independent facts (implement + count + kg) into one "format" zoo; it splits:
  - **Weight exotics die.** `split_tier` → a row-group (compound of 2 rows, per-element reps/load); `with_asymmetric_arm` → weight `single` + an arm-role MODIFIER; `with_depth_modifier` → weight `single` + a depth MODIFIER (`full_rom`/`partial` die — zero corpus). `single` + `single_arm` MERGE (`single_arm` = "one arm" is SIDE, not a weight format). `compound_device` equipment list trims `BOX`/`SOFA`/`BOX_OR_SOFA` (position photography in the weight cupboard).
  - **load variants:** `absolute { count: 1|2, kg }` · `percentage { value, reference: self | other-exercise }` · `bodyweight` · `byProfile { label → weight }[]`. `none` is killed (a duplicate of bodyweight).
  - **count = an EXPLICIT row choice**, not derived: a KB swing two-handed is ONE implement (side=both), a DB press is TWO (side=both) — same side, different count, so count is a function of NEITHER side NOR the implement type. The implement TYPE (DB/KB/barbell) rides the EXERCISE via the equipment library; _how many_ is always the coach's choice on the row.
  - **percentage** reference = `self` (% of THIS exercise's 1RM) | `other-exercise` (% of another catalog exercise's 1RM); the `family` ref dies with movement types; the 1RM resolver lands in Phase 3 (athlete core).
  - **byProfile** = a `{ label → weight }` list, labels a coach dictionary (m/f, rx/sc, age, …); resolver with athlete context (the `{first, second}` pair was too thin — profiles vary by sex/level/age).
- **Rationale.** D-5 channels: the exotics were cardinality-≤6 photographs of one personal plan. The implement/count/kg fusion was the disease — owner: "гантель может быть одна или две, гиря одна или две… как это работает?" Answer: three facts, three homes — implement→equipment library, count→explicit row field, kg→load. The orchestrator's earlier "drop count, derive from the implement" was WRONG (count isn't derivable) and was retracted. Closes F-WEIGHT-EXOTICS.
- **Consequences.** W4: `WEIGHT_VARIANTS` + the exotic schemas/editors die; absolute load → `{count, kg}`; `none` dropped; percentage reference → self|other; byProfile → label-map list (seed `byProfile` reshaped). The implement TYPE on the row rides the catalog/equipment-library pass (EQUIPMENT-LIBRARY ledger item). The 1RM resolver is Phase-3 work — W4 stores percentage as a relative prescription only.

### D-TEMPO — 4-digit typed (X allowed); verbal forms become modifiers

- **Status:** RATIFIED (2026-06-12, owner).
- **Decision.** The canonical 4-digit `fullTempo` STAYS TYPED; each position accepts an int OR `"X"` (explosive phase, e.g. `3-1-X-0`). The verbal forms (`pauseInUp`, `perNthRepPause`, `slowEccentric`, `holdAfterLast`) → MODIFIERS (D-MODIFIER, the 3-layer boundary). Closes F-TEMPO.
- **Rationale.** The 4-digit is standard sport notation awaiting an engine — typed despite no live machine reader today (the byProfile precedent; the boundary's explicit carve-out). The verbal pause/hold strings are dictionary "how to execute" → modifiers. `X` is a real corpus value (explosive concentric), so positions are `int | "X"`.
- **Consequences.** W4: `tempoModifierSchema` slims to `fullTempo` only (position type `int | "X"`); the four verbal sub-structures die → seed re-express as modifier refs.

### D-EXEC-DEFER — execution/scoring semantics are notes until the Phase-4 executor

- **Status:** RATIFIED (2026-06-12, owner — "straight into" gap acknowledged as deliberate).
- **Decision.** Execution/scoring semantics — "straight into / no-rest transition", "for time", "score only counts on rounds 2 & 3", "not for score", "AMRAP at 90%+ effort" — are NOTES today, and will be typed FRESH against the Phase-4 executor (re-introduce-fresh, ADR-0038). NO inert boolean (e.g. `continuous` / `noRestBefore`) is added now.
- **Rationale.** Nothing reads execution semantics today — there is no timer/scoring engine (charter non-goal). Schema order already says "then"; "without pause" only MEANS something to an engine. A stored boolean awaiting a reader is exactly the inert-surface disease W2/W3 spent two waves draining. The owner flagged the real gap honestly ("straight into" не выражается однозначно) — the honest answer is that it is the execution layer, deferred whole, not a hole in the primitive.
- **Consequences.** Recorded as a known-loss in `deferred.md`. When the executor lands (Phase 4), continuous-execution and scoring-scope become typed relations designed against it — likely a sequential-continuous Group MODE beside the existing parallel interleave.

### D-HEADER-KEEP — the schema header stays; F-HEADER is UX parity only

- **Status:** RATIFIED (2026-06-12, owner override of the orchestrator's "header dies" rec).
- **Decision.** `Schema.header` STAYS a field, untouched (cosmetic). F-HEADER is NOT a model question — it is a UX-parity item: a schema's header must render identically whether the schema is standalone or inside a group (today the in-group member has its top zone cut). Closes F-HEADER → a W4 UX item.
- **Rationale.** Owner: "да всё нормально с хедером схемы, не трогаем, это уже косметика. просто нужно сделать чтобы хедер схемы в группе выглядел так же как хедер схемы без группы." The orchestrator's "header dies, generate the display title from content" was a model-purity argument; the owner's call (his product/UX domain) is to keep the field. The only real work is in-group render parity.
- **Consequences.** W4: no model change to `header`; the editor renders an in-group schema's header like a standalone schema's header.

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

- **Status:** SUPERSEDED (2026-06-13, W4-editor build — by **D7 / D-HEADER-KEEP**; kept for the trail). The W1/ADR-0040 "boxed PARENT" this governed was a structurally-parallel parent under the derived-parallelism model; W2 dissolved derived-parallelism into the explicit `SchemaGroup` box, and W4-editor's D7 ratifies that an in-group schema renders its title row (composition chip + `InlineEditText` title) **identically to a standalone schema** — the inverse of this decision's "suppress the in-box schema head". The opaque `SchemaGroup` label zone (the box's own coach-owned label, D-2) is a separate surface and survives; what dies is suppressing a MEMBER schema's own header.
- **Original decision.** On a boxed parent the `parallel` `SchemaCompositionTag` chip AND the card-head title are suppressed; the parent's `header` is shown + edited ONCE, in the box label zone, via `InlineEditText` reusing the existing `handleTitleCommit` → `useUpdateSchema` → `{ header }` path. The label binds the RAW `header ?? ""` (empty → neutral placeholder "group…", NOT the derived structural label, NOT an empty chip). The `deriveCompositionLabel` / `formatCompositionSummary` MECHANISM and the meta summary ("parallel (round by round)") are untouched.
- **Original rationale.** Deliverable-2 directive: dedupe the PRESENTATION, not the mechanism. No information is lost — the interleave-order stays in the meta summary; non-boxed parents are byte-identical to before. No new field (header is already a stored, updatable column).

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

- **Status:** SUPERSEDED (2026-06-11, orchestrator review — the premise was falsified live).
- **Original decision.** `@@unique([blockId, order])` consciously NOT added when `parentSchemaId` dies; deferred as W2-ORDER-UNIQUE → W3, on the premise that top-level order "was never DB-enforced".
- **Why superseded.** The premise (planted by the orchestrator's prompt, carried faithfully by the runner) was FALSE: enforcement lived in the raw-SQL check layer — `prisma/sql/lms-checks.sql` ships a partial unique `schemas_block_top_order ON training_schemas ("blockId","order") WHERE "parentSchemaId" IS NULL`, applied by `apply-sql-checks.ts` at every `db:reset`. Invisible to `schema.prisma` reads, and BOTH straggler greps (prompt verify-pass + runner Priority-1) missed `.sql` under `prisma/sql/`. The owner's `db:reset` failed live (42703: column `parentSchemaId` does not exist) — the check referenced a dead column, so omitting the unique was not "no regression", it was a broken reset + a dropped invariant.
- **The fix (review commit, same branch).** The check became a FULL unique `schemas_block_order ON ("blockId","order")` — every schema is block-level now, so this is the SAME invariant over the SAME population, not a new constraint. Mutation trace under the live unique: reorder's two-phase negative-order dance survives verbatim (negatives never meet positives); group atomic create is tail-append (safe); `resolveGroupedOrder`'s trailing shift was the one collider (`Promise.all` +`ORDER_STEP` over a 10-spaced sequence) → rewritten descending-sequential; the into-group test now pins TWO trailing schemas (the collision shape). **W2-ORDER-UNIQUE is CLOSED — nothing remains for W3.**
- **Lesson promoted.** Straggler sweeps and "is X enforced" claims must cover the raw-SQL layer (`prisma/sql/`, `scripts/`) — tsc, vitest, and `.ts`-scoped greps are all blind to it; only `db:reset` executes it.

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

---

## W3 implementation calls (DR-W3-\*) — the editor remap: prototype fidelity, gesture set, draft collapse

W3 makes the EDITOR catch up to the W2 model. Nothing in the data model, the API surface, or the `buildBlockItems` clustering predicate changes — W3 is a UI/UX remap onto ADR-0041 plus an internal authoring-draft refactor (NOT a new one-way door, so no new ADR). The owner's hi-fi prototype (`plan-editor-hi-fi-v-2`) is the UX law for the group card: a solid tinted frame, GROUP overline, continuous accent rail, numbered track badges, segmented interleave, and a button gesture set (Add group / Add track / Ungroup / Delete-with-tracks) replacing drag-one-onto-another. One LIVE idempotency 400 dies; the last recursion in the codebase (the authoring draft) collapses; QA-004 gets its confirm; the W2-STALE-\* hygiene riders land. Ratified during the W3 `/feature` build (2026-06-12, branch `feat/session-primitive-w3-editor-remap`, 10 commits). All runnable gates green: `check-types` 16/16, `lint` 16/16, `dep:check` 0, platform vitest 844+, `@repo/contracts` 741. These promote the design's §7 decision record (`.feature-dev/1781247806/design.md`) with the in-build deviations actually taken folded in honestly.

**Single api-server touch — the seed const rename (DR-W3-FORK-3), flagged for audit:** the wave's ONLY change outside platform/`@repo/api-routes` is a PURE identifier rename of one seed const (`BLOCK_FOOTNOTES_WK2_TUE` → `BLOCK_PER_ROUND_MARKERS_WK2_TUE`, 3 sites: def + import + array reference). The seed DATA is byte-identical (`blockInstanceRef: "block-183"`, order, labels, rows all untouched) — verified by `git show` and compiled by `pnpm check-types` (which type-checks api-server). Because there is NO behavior or data change, the gated api-server suite is NOT required for this wave; the owner may OPTIONALLY run it at merge for belt-and-suspenders. See DR-W3-FORK-3.

### DR-W3-1 IDEM-DASH — the idempotency key separator is a dash; the FORMAT is pinned against the server's real regex

- **Status:** RATIFIED (2026-06-12, W3 build — D1, W2-UX-POLISH item 1).
- **Decision.** The per-track idempotency key separator changes from `:` to `-`: `` `${idempotencyBaseKey}-${trackIndex}` `` (uuid chars + `-` are all inside `IDEMPOTENCY_KEY_REGEX = /^[A-Za-z0-9_-]{1,256}$/`). The stability property is preserved (same key per (GroupDraft.id, trackIndex) within the modal session — the retry-dedup mechanism, DR-W2-4). A new format-pin test imports the REAL `IDEMPOTENCY_KEY_REGEX` from `@repo/api-routes` (via FORK-2's barrel export) and asserts every key the hook emits matches it; the existing stability tests updated for the new separator.
- **Rationale.** This was a LIVE prod-shape bug: the unchecked independent-ladders path 400'd with "Idempotency-Key header malformed" on every `POST /schemas` (the COLON is outside the charset — length 38 was a red herring; the client's default `crypto.randomUUID()` passes, which is why ONLY this custom-key path broke). W2's MT-19 pinned key STABILITY against a mocked client but never key FORMAT against the server contract — that is the seam the format-pin test closes. The hook is the only custom-key producer (verified by `grep idempotencyKey` across `apps/`).

### DR-W3-2 PROTO-CARD-LOCAL — the proto group card is built platform-local; `AccentGroupCard` is dropped, not modified

- **Status:** RATIFIED (2026-06-12, W3 build — D2, W2-UX-POLISH item 2).
- **Decision.** The hi-fi prototype card is built PLATFORM-LOCAL under `apps/platform/src/modules/plan-detail/components/` (the `schema-group-box.tsx` rewrite + new sub-components, one component per file: head, track wrapper, track badge, seg control). `@repo/ui`'s `AccentGroupCard` is DROPPED from the box, NOT restyled — its def + test + the one Storybook showcase stay untouched (research §9.2: the group box was its only PRODUCT consumer).
- **Rationale.** Restyling a shared `@repo/ui` primitive for a platform-local need would have a wider blast radius and needs a Gate-A fork; the box is the only product consumer, so a local rebuild is the cleaner, lower-coupling move (reuse-before-invent does not mean restyle-shared-for-one-caller). All colors map to `palette` slots + `alpha` (no hex): `#E07B35` → `primary.main`, frame border `alpha(primary.main, 0.35)` SOLID (the W1 dashed look dies), frame bg `0.03`, rail `0.45`, head-border `0.25`.
- **Consequences.** The member `SchemaCard` gains a minimal additive `isDraggable` prop (default true; the box passes `false`) so the in-group member card has no drag handle (numbered track badges replace member handles) without forking a second card component — keeps `schema-card.tsx` the single member-card shell.

### DR-W3-3 SEG-CONTROL — interleave editing uses a platform-local segmented control

- **Status:** RATIFIED (2026-06-12, W3 build — D2).
- **Decision.** Interleave-order editing uses a platform-local `.seg` segmented control (the 2 `PARALLEL_INTERLEAVE_ORDERS` as joined `aria-pressed` buttons), replacing the W2 MUI `Select` on the box meta. Same `PUT /groups/{id}` `{ interleaveOrder }` mutation (DR-W2-FORK-4 unchanged); `onChange` fires only when the value actually changes.
- **Rationale.** Prototype fidelity (the proto's `.seg`); a 2-value toggle reads better as a segment than a dropdown. The W2 test reached the control via `getByRole("combobox")` — that seam disappears; the rewritten test asserts on the buttons by text + `aria-pressed`.

### DR-W3-4 ADD-TRACK-INSTANT — "Add track" is an instant create, the modal stays for standalone

- **Status:** RATIFIED (2026-06-12, Gate A — FORK-1a).
- **Decision.** "Add track" fires an INSTANT `POST /schemas` with `{ groupId, composition: { repetition: { kind:"ladder", steps:[21,15,9] } }, header:null, notes:null }` via `useCreateSchema`; a new numbered ladder member appears at the group tail (contiguity safe — server tail-appends), refined inline on the member card afterward. The axis modal stays the path for STANDALONE schema creation (the block-level "Add schema").
- **Rationale.** It is literally the prototype's interaction and the lower-friction daily gesture on the hottest in-box surface; `POST /schemas` already forwards `groupId`. FORK-1b (keep a relabeled 4-click modal on the hottest gesture) was rejected — friction for no benefit.

### DR-W3-5 DELETE-GROUP-CLIENT — Delete-group-and-tracks is client-orchestrated; no server flag

- **Status:** RATIFIED (2026-06-12, W3 build — D3).
- **Decision.** "Delete group + tracks" is client-orchestrated sequential `DELETE /schemas/{id}` over the members (a bespoke `useDeleteGroupWithMembers` `{run, isPending}` hook mirroring `useCreateIndependentLadders`). The LAST delete auto-removes the now-empty group server-side (existing behavior). Mid-failure → toast + single `finally`-invalidate (the survivors are still a valid group). NO server `?withMembers` flag.
- **Rationale.** A `?withMembers` server flag would break the no-api-server-change boundary and re-arm the gated-suite ritual for a gesture the client can orchestrate (spec rec + research agree). The box is a pure render of `buildBlockItems` output, so it unmounts automatically when its last member vanishes — no local "is alive" state, no `useEffect` cleanup.

### DR-W3-6 ADD-GROUP-REUSE — block-level "Add group" reuses the group-create path

- **Status:** RATIFIED (2026-06-12, Gate A — FORK-4a).
- **Decision.** The block-level "Add group" affordance (a `PlusRowButton` next to "Add schema" in the block footer) reuses `useCreateGroup.run` with a seeded 2-track default `GroupDraft` (`{ tracks: [{ steps:[21,15,9] }, { steps:[9,15,21] }] }` — the proto's `21-15-9` / `9-15-21`) through the validated `buildGroupCreateRequest` path. Atomic `POST /groups`.
- **Rationale.** Reuses the existing validation + coach-message + invalidation path; zero parallel code. After the D4 collapse the draft IS the flat `GroupDraft`, so seeding two default tracks is trivial — a from-scratch creator constructs the flat draft directly (no schema-to-draft round-trip). FORK-4b (a thin new hook with a hardcoded request) was rejected as a parallel code path.

### DR-W3-7 DRAFT-FLAT — the recursive authoring draft collapses to flat types

- **Status:** RATIFIED (2026-06-12, W3 build — D4, W2-DRAFT-RECURSION).
- **Decision.** The recursive `ComposeContainer.children: ComposeNode[]` (where a child could itself be a container — the last recursion in the codebase) collapses to two NON-recursive types in `axis-draft.types.ts`: `SchemaDraft { id, header, notes, repetition?, rest?, rows: ComposeRow[] }` (single-schema authoring — flat-create + edit; `children` renamed `rows` for honesty, NEVER contains containers) and `GroupDraft { id, header, tracks: TrackDraft[] }` with `TrackDraft { id, header, steps }` (a track is always a bare ladder; `steps` is the only axis it carries). `ComposeNode`/`ComposeContainer` are DELETED from the platform layer; the modal's draft state becomes a `DraftSeed` union (`{ mode:"schema", schema } | { mode:"group", group }`). The `nodeType` discriminator dies entirely (no node is polymorphic anymore). DR-W1-2 / DR-W1-5 semantics survive byte-for-byte (checkbox default-checked at ≥2 tracks, per-track client-side validation with coach-message parity, non-atomic unchecked path).
- **Rationale.** Red line #3 forbids recursion "anywhere"; the draft was the last holdout — fully isolated to the authoring layer (never stored, never on the render path), but the red line is the red line. The flat split is strictly flatter than the spec's fallback ("container children rows-only + a separate group draft"): a `TrackDraft` collapses to `{ id, header, steps }` because tracks get their rows AFTER creation via the member card, not in the modal.
- **Consequences / deviations (recorded honestly).**
  - `DraftSeed` was hoisted INTO `axis-draft.types.ts` (not kept modal-local) to avoid a circular import.
  - `arrangement-tree.ts` was **DELETED, not renamed** (the runner-prompt §7.3 said rename to a "track/row splitter"). The flat collapse made `collectTrackChildren`/`collectDirectRows` dead — tracks are `GroupDraft.tracks` (a direct array) and rows are `SchemaDraft.rows` (a direct array), so there is nothing left to split. Deletion > rename — this resolves the `arrangement-tree` half of W2-STALE-NAMES by deletion (the file's reason-to-exist evaporated).
  - A cycle-break: `REPETITION_DEFAULTS` / `DEFAULT_TIME_CAP` were extracted into a new leaf `axes/repetition-defaults.ts` (14 lines). Wiring D5 directly would have created a `repetition-axis-field ↔ is-repetition-dirty` import cycle; extracting the shared consts breaks it at the source (manifesto 2.1 — fixed, not silenced).

### DR-W3-8 KIND-SWITCH-CONFIRM — a dirty repetition-kind switch confirms before discarding

- **Status:** RATIFIED (2026-06-12, W3 build — D5, QA-004; the keep-confirm-always edge ratified by the owner, QA-114).
- **Decision.** A `ConfirmationModal` gates a DIRTY repetition-kind switch (would discard authored content beyond the kind's default); clean switches stay silent. Two discard points, both flowing through a kind change: (1) edit/single-axis in `RepetitionAxisField` — dirty iff the current `value` is not deep-equal to `REPETITION_DEFAULTS[value.kind]`; (2) create-mode parallel→non-ladder in `create-schema-flow` — `flattenToKind` discards `GroupDraft.tracks` (a materialized parallel is always "authored" → always dirty). One shared `kind-switch-confirm.tsx` dialog + an `is-repetition-dirty.ts` predicate, consumed at both sites. Pristine just-seeded axes and re-selecting Ladder while parallel (a no-op) stay silent.
- **Rationale.** QA-004 (carried since compose-authoring-ux) — switching kinds silently nuked authored ladder steps; the editor rebuild is its scheduled home. The gate sits at each discard SITE (not one central place) because `RepetitionAxisField` is reused in contexts with different discard semantics (single axis vs parallel group).
- **The QA-114 owner edge.** A kind-switch on a PRISTINE parallel group still confirms — RATIFIED as **keep-confirm-always**. Rationale: it collapses the 2-track STRUCTURE (`GroupDraft.tracks`), not just per-axis content, so even an unedited parallel is "authored structure" worth a confirm. (Owner call.)

### DR-W3-9 DEMOTE-HINT-KEPT — `should-be-container` + the demote hint are retyped, not deleted

- **Status:** RATIFIED (2026-06-12, W3 build — D4 scope-tightening).
- **Decision.** `should-be-container.ts` + the `container-inspector` demote hint are RETYPED to `SchemaDraft` (`rows.length`), NOT deleted, even though both appear fully dead post-collapse: the "Demote to row" BUTTON never renders (the modal passes `onDemoteNode={undefined}`), and the demote-hint ALERT is unreachable in create mode (post-collapse `SchemaDraft.rows` is always `[]` in create — rows are added on the card after creation, so `rows.length===1` can't occur).
- **Rationale.** Deleting a coach-facing affordance — even a dead one — is a product call, not a refactor call (manifesto: don't refactor-beyond-scope without a green light). Retyping is mechanical and in-scope.
- **Consequence (follow-up flagged).** The demote hint + `should-be-container` + `DEMOTE_BUTTON_LABEL` are candidates for a clean ~3-file deletion. The owner chose CARRY at Gate A → carried as the OQ1 follow-up in `deferred.md`.

### DR-W3-10 HYGIENE — the W2-STALE-\* riders land

- **Status:** RATIFIED (2026-06-12, W3 build — D6).
- **Decision.** (1) **W2-STALE-FIXTURES:** the dead `compoundRep: null` line dropped from `exercise-row-payload-form.test.tsx` + `rest-row-form-schema.test.ts`. (2) **W2-VESTIGIAL-EXPORTS:** `composeNodeSchema` + `ComposeNode` deleted from contracts `composition` (a 1-line four-projection retype `ComposeNode` → `ComposeContainer`, which survives); the self-referential `POSITION_EQUIPMENT_MODIFIERS` / `positionEquipmentModifierSchema` / `PositionEquipmentModifier` trio + their test `describe` block deleted from `_shared/media.ts` (zero consumers verified). (3) **W2-STALE-NAMES:** the `DerivedLabelCard` caption fixed `"computed (arrangement-first)"` → `"computed (repetition-derived)"` (the one coach-visible item — labels derive from repetition only post-arrangement-death); `arrangement-tree.ts` resolved by deletion (DR-W3-7); the seed const renamed (FORK-3, owner-delegated).
- **Rationale.** All scheduled W2 hygiene; each deletion verified zero-consumer before removal. The two sanctioned contracts touches (the dead-export deletions) are within the runner-prompt's allowed exceptions.

### DR-W3-FORK-2 EXPORT — `IDEMPOTENCY_KEY_REGEX` is barrel-exported from `@repo/api-routes`

- **Status:** RATIFIED (2026-06-12, Gate A — FORK-2a).
- **Decision.** An additive 1-line export `export { IDEMPOTENCY_KEY_REGEX }` is added to the `@repo/api-routes` barrel (and the `idempotency/index.ts` sub-barrel for internal consistency), so the D1 format-pin test imports the REAL regex (DR-W3-1).
- **Rationale.** `IDEMPOTENCY_KEY_REGEX` lived ONLY at `idempotency/constants.ts` and was NOT exposed on the `.` barrel — the owner's red line ASSUMED a read-only import existed; it didn't, so the spec's "import the REAL regex" was impossible without this export. `@repo/api-routes` is NOT in the hard red-line list (which is contracts/Prisma/api-server/seed); its suite is ungated and fast; `dep:check` already permits `apps/platform → @repo/api-routes`. This touches `@repo/api-routes`, NOT api-server → no gated-suite ritual. FORK-2b (re-home into contracts) and FORK-2c (duplicate the literal in the test) were rejected (bigger blast radius / defeats the pin-against-source-of-truth point).

### DR-W3-FORK-3 SEED — the seed const rename (owner-delegated; the wave's single api-server touch)

- **Status:** RATIFIED (2026-06-12, owner-delegated — "реши сам" + "сид не охраняю, как раз думал его чистить").
- **Decision.** The misleadingly-named seed const `BLOCK_FOOTNOTES_WK2_TUE` (it holds plain EXERCISE rows now, not FOOTNOTE rows, after the W2 footnote-kind death) is RENAMED `BLOCK_PER_ROUND_MARKERS_WK2_TUE`. 3 sites: the `export const` def (`week-2-tuesday-compounds.ts`) + the import + the array reference (`week-2-tuesday.ts`).
- **Rationale.** The design's §FORK-3 rec was "LEAVE IT" on the standing red line (re-touching the seed re-arms the boundary the owner guards). The owner BROKE THE TIE the other way: delegated the call ("реши сам") and explicitly de-armed the boundary ("сид не охраняю, как раз думал его чистить"). The rename is the SINGLE api-server touch of the wave — a PURE identifier change, seed DATA byte-identical (`blockInstanceRef`, order, labels, rows untouched — verified by `git show`), fully type-checked by `pnpm check-types` (which compiles api-server).
- **Consequence (flagged for audit).** Because there is NO behavior or data change, the gated api-server suite is NOT required for this wave; the owner may OPTIONALLY run it at merge for belt-and-suspenders. This is the one place the platform-only boundary is crossed, and it is crossed only cosmetically with owner sign-off.

### DR-W3-REENTRY — a synchronous re-entry guard on every new gesture surface (post-QA CRITICAL)

- **Status:** RATIFIED (2026-06-12, W3 build — post-QA fix; QA-104 + siblings QA-102/103/105).
- **Decision.** A synchronous re-entry guard (an `isRunningRef`/`isFiredRef` mirroring the existing `isSubmittingRef` pattern) is added to ALL new gesture surfaces: delete-group (`useDeleteGroupWithMembers`), add-track (`add-track-button`), add-group (`add-group-button`), and the box-level ungroup/delete confirms (`schema-group-box`). Pinned by double-fire tests on each.
- **Rationale.** A post-QA CRITICAL (QA-104): a double-click on "Delete group" double-fired the sequential delete → a contradictory toast (the second run sees the already-deleted members). The async `isPending` flag flips a render too late to block a synchronous second click; a ref guard blocks re-entry within the same tick. Siblings QA-102/103/105 are the same class on the other new gestures — fixed uniformly. (Pattern reuse: the codebase's existing `isSubmittingRef` already solved this for the modal submit.)
- **Narrowed at the owner walkthrough (2026-06-12, DR-W3-12):** the component-level refs on the two MODAL confirms (ungroup / delete-group) were removed — the modal pending pattern guards those; the refs remain ONLY on the modal-less buttons (add-track, add-group) and inside `useDeleteGroupWithMembers` (batch idempotency).

### DR-W3-11 PTR-COLL — mixed-height sortable lists use pointer-first collision

- **Status:** RATIFIED (2026-06-12, owner-walkthrough fix round 2).
- **Decision.** The block-items list (`block-card-body` DndContext) uses `pointerFirstCollision` (`lib/pointer-first-collision.ts`): `pointerWithin` first, `closestCorners` fallback for the gaps. Any FUTURE list mixing item heights (a small schema next to a tall group) uses the same composite. Uniform-height lists (sessions / blocks / rows / schemas-only) keep their simple metric (`block-list` moved to `closestCorners` en route — harmless, kept).
- **Rationale.** The owner's walkthrough found group↔schema reorder "flapping": drops snapped back, targets only registered at deep accidental overlap, different-sized items behaved differently — while every UNIFORM list worked. Root cause: `closestCenter`/`closestCorners` measure rect geometry, and on heterogeneous heights the `over` candidate flaps as a small dragged rect crosses a huge target. `pointerWithin` makes the target THE element under the cursor — deterministic, size-independent, and it matches the hand's mental model ("куда указываю — туда и встанет"). jsdom cannot catch this class (no real pointer geometry); the browser walkthrough is the gate for the DnD layer.

### DR-W3-12 MODAL-PAT — group confirmations follow the house modal pending pattern

- **Status:** RATIFIED (2026-06-12, owner-walkthrough fix round 2 — owner: "придуман мини-велосипед вместо существующего паттерна").
- **Decision.** The ungroup and delete-group `ConfirmationModal`s behave exactly like every other confirm in the app (the schema-delete canon): the dialog STAYS OPEN until the operation settles (`onSuccess` close for the react-query mutate; await-then-close for the batch hook), `isConfirming` drives the disabled Processing… button + blocked backdrop/Escape. The early `setOpen(false)` + component-level re-entry refs are REMOVED on these two surfaces (see DR-W3-REENTRY narrowing).
- **Rationale.** Consistency is the feature: a coach learns ONE confirm behavior. The early-close + ref combo duplicated, worse, what `isConfirming` already provides — and visibly diverged (the dialog vanished while work was still running). Double-fire protection on modal confirms now comes from the same place as everywhere else (disabled button while pending); the batch hook keeps its internal idempotency for the sequential delete.

---

## W4-model implementation calls (DR-W4-\*) — the data-layer reshape: row grammar + leaf VOs + the two new entities

W4-model lands the ratified row grammar (D-FLOORS / D-ROW-GRAMMAR / D-LOAD-FINAL / D-TEMPO / D-MODIFIER / D-PLAQUE / D-HEADER-KEEP / D-EXEC-DEFER) as the data layer: the row collapses to ONE authored kind (exercise), two NEW entities appear (a row-MODIFIER library à la `Label`; a ROW-GROUP à la `SchemaGroup` one floor down), the leaf VOs slim (load `{count,kg}`+exotics death, tempo→`fullTempo`, the `sequence`/`weight` VOs die), per-floor settings relocate (block loses intensity+timeCap; intensity is schema-only), notes become an ordered multi-list on every carrier, the seed re-expresses every evil-fixture shape, and `apps/platform` typechecks + renders off the reshaped contracts (dead-but-functional UX, exactly as W2 left the platform for W3). The **authoring-UX rebuild is the separate W4-editor wave** after this. This is the `db:reset` world — NO migration files, aggressive bridge-free (intermediate RED trees fine; only the final pushed state green). Ratified during the W4-model `/feature` (full) build (2026-06-13, branch `feat/session-primitive-w4-model`, 3 commits). All runnable gates green: `check-types` 16/16, `lint` 16/16, `dep:check` 0, `@repo/contracts` 664, platform vitest 514. NOT a new one-way door — rides **ADR-0041** (W4-model reshapes the leaf ONTO the existing model-core; no new ADR). These promote the design's §7 decision record (`.feature-dev/1781344700/design.md`) with the in-build deviations folded in honestly. **The api-server gated suite is the OWNER's manual acceptance ritual (PENDING — see `deferred.md`).**

### DR-W4-1 NOTES-JSON — notes = a `notes Json?` `string[]` column on EVERY carrier (convert-all)

- **Status:** RATIFIED (2026-06-13, W4-model build — design §7 FORK-1).
- **Decision.** A `notes Json?` column holding a validated `string[]` (`notesListSchema = z.array(z.string().trim().min(1).max(NOTE_MAX_LENGTH)).max(NOTES_MAX_COUNT)`, the per-note/per-list caps in `_shared/notes.ts`), parsed null-guarded in each mapper. SCOPE = convert ALL `notes String?` carriers (**Week / Day / Session / Block / Schema / SchemaRow**) + ADD `notes Json?` on **SchemaGroup / RowGroup**. ONE consistent shape everywhere.
- **Rationale.** Notes are channel-3 human text (D-5) — always read with their parent, edited as a list, never machine-read or cross-queried. Zero hot-path includes (decisive — the week GET is 6 levels deep). Matches the house Json convention (load/reps/tempo/composition/interleaveOrder are all Json) + the W2 DR-W2-FORK-1 Json-over-coupled-table precedent. A half-converted model (some list, some string) is a latent trap for W4-editor; convert all. Week is a parent carrier with the same human-text semantics, so it converts too even though D-FLOORS lists notes only Day-and-below.
- **Consequences.** 7 column-type flips (`String?`→`Json?`) + 2 new columns; one `notesListSchema`; each mapper gains a `x === null ? null : notesListSchema.parse(x)` guard. The W4-editor edits the whole list in one PATCH per parent. The `[ EXAMPLE: … ]` strip, the `sequence`-prose remainder, the "= 1 rep" framing, and the MAX tails all re-express as notes in the seed.
- **Reversibility.** Medium — a future cross-carrier notes engine re-introduces a `Note` table FRESH (ADR-0038); the Json shape doesn't block it. (Alternative A — a polymorphic `Note` join — was rejected in design §6.A: no Prisma relation integrity OR a raw-SQL CHECK re-arming the DR-W2-8 trap, a `notes` include on EVERY of 7 carriers on the hottest read, an `order` column + reorder ×7, against the house Json convention, and a per-note CRUD surface ×7 in W4-editor — per-note addressability buys nothing for channel-3 text.)

### DR-W4-2 MOD-WRITE — modifier write = `modifierIds: string[]` (ordered) on the row create/update payload

- **Status:** RATIFIED (2026-06-13, W4-model build — design §7 FORK-2).
- **Decision.** No dedicated `/row-modifiers` route. The row endpoint replaces the whole assignment set transactionally (`replaceRowModifiers`: `deleteMany {rowId}` then `createMany` with `order: i`), in the SAME Serializable tx as the row column write, mirroring `assignBlockLabels`. The read embed = `modifiers: ModifierRef[]` on the row (the full `modifierSchema`, sorted by assignment `order`). `modifierIds: undefined` leaves assignments untouched; `modifierIds: []` clears them all (set-replace semantics).
- **Rationale.** Lower surface; the row PATCH already round-trips; matches the `BlockLabelAssignment` write model (`labelIds[]` set-replace, not per-assignment CRUD). (Alternative D — a dedicated `/row-modifiers` assign route — was rejected in design §6.D: extra surface for incremental add/remove the W4-editor doesn't need, since it edits the whole row.)
- **Consequences.** The week-GET include gains `rows.modifierAssignments.modifier` (ordered); `mapToSchemaRow`'s input type gains the modifier include (DR-W4-MAPPER-INPUT). A non-existent `modifierId` → P2003 on the assignment FK → a clean handled 400 (the tx rolls back, no orphaned clear) — the message names "SchemaRow" not "Modifier" (misleading-but-safe, recorded as W4R-006/QA-003 in `deferred.md`).
- **Reversibility.** Easy — a dedicated assign route is additive if the editor ever needs incremental ops.

### DR-W4-3 ROW-COLLAPSE — drop `rowKind` enum + `rowPayload`; `exerciseId` promoted to a loose row column (no FK); render-kind inferred (VERIFIED)

- **Status:** RATIFIED (2026-06-13, W4-model build — design §7 FORK-3, alt-b, premise verified in code).
- **Decision.** Drop the `RowKind` Postgres enum + `SchemaRow.rowKind` + `SchemaRow.rowPayload`; ADD `exerciseId String` (a LOOSE string, NOT a Prisma FK); kill `schemaRowPayloadSchema` + `assertRowKindPayloadAlignment` + the `exerciseFormSchema` union (delete `compounds.ts` entirely). The render-kind is INFERRED from the exercise's `placeholderFlag` (the interim nature carrier), never stored, never authored — the first authoring step (W4-editor) is the exercise select.
- **Verification (the FORK-3 gate, why alt-b not alt-a).** (i) `exerciseId` TODAY is already a loose string INSIDE `rowPayload` Json (`exerciseFormSchema` atomic branch = `{form:"atomic", exerciseId: z.string().cuid()}`), NOT a Prisma FK — confirmed at `compounds.ts:58`; promoting it to a column keeps it loose (NO FK) to match the existing convention; adding an FK is out of scope/cost (the catalog pass's call). (ii) NO hard coupling forces alt-a: `performedExerciseInstances` relates to `SchemaRow` by id, NOT to `rowKind` (`schema.prisma:712`); `compose-projection.mapper` coupled to `rowKind`/`rowPayload`/`position` (reshaped); `assertRowKindPayloadAlignment` dies (its file becomes `assertRowGroupMembersContiguous`); the coverage cells reference them (reshaped in the seed batch). Keeping a 1-value enum + a Json `rowPayload` wrapper around a single string would be inert stored surface — the exact disease the initiative kills (alt-a rejected, design §6.C).
- **Rationale.** Spec §4 result line: "Today's 9-column zoo + 4 row kinds gone." A row IS an exercise — one kind (D-ROW-GRAMMAR).
- **Consequences.** Bridges (the full `concrete|placeholder|rest` nature enum is the SEPARATE catalog pass — CATALOG-NATURE): `REST_SLOT` → a new seed Rest exercise (`placeholderFlag:true`); `PLACEHOLDER` → existing `placeholderFlag` exercises; `RowKind.REST` → `composition.rest`. The runtime API has NO existence check on `exerciseId` (no FK, no contract resolve) — a dangling ref persists and renders as the literal "exercise" fallback (no crash); the ONLY guard is the seed's `assertExerciseRefsResolve` X-invariant, CONFIRMED to catch the new top-level `row.exerciseId` (QA-004 — the stated R2 trade-off, NOT a regression; the FK is the catalog pass).
- **Reversibility.** Hard (data reshape) — but an additive re-introduce of a nature column / an FK IS the catalog pass anyway.

### DR-W4-4 LOAD-COUNT — `absolute {count:1|2, kg}` (count nested in the load VO, an explicit row choice)

- **Status:** RATIFIED (2026-06-13, W4-model build — design §7 FORK-4).
- **Decision.** `count` lives in the load VO (`absolute.count: z.union([z.literal(1), z.literal(2)])`, `kg: z.number().positive()`), authored per-row — an explicit coach choice, NOT derived from the implement type OR `side`. The whole Weight VO dies; `loadSchema` drops `none` (= bodyweight) + `percentage.movement_family`; `byProfile` → `{entries: {label, kg}[]}` (the `{first, second}` pair was too thin); `percentage` reference = `self | other_exercise`; `bodyweight` kept.
- **Rationale.** The spec's "count lives on the row" = "is an explicit row-author choice"; the load VO IS a row field. D-LOAD-FINAL: a KB swing two-handed is ONE implement (side=both), a DB press is TWO (side=both) — same side, different count, so count is a function of NEITHER side NOR the implement type. The earlier "drop count, derive from the implement" was WRONG and retracted. Grid B: "absolute `{count:1|2, kg}`".
- **Consequences.** `loadSchema` absolute branch reshaped; the Weight VO file deleted; seed `absoluteLoad` reshaped to `({count, kg})`. The implement TYPE on the row rides the catalog/equipment-library pass (EQUIPMENT-LIBRARY); the 1RM resolver for `percentage` is Phase-3 work (W4 stores percentage as a relative prescription only).
- **Reversibility.** Easy (additive VO change).

### DR-W4-5 ONE-WAVE — run the WHOLE W4-model in one /feature (no A1/A2 split)

- **Status:** RATIFIED (2026-06-13, W4-model build — design §7 FORK-5; Gate A judged the wave runnable whole).
- **Decision.** One `/feature` (full) run; organize into reviewable batches (foundation → server → seed → platform), some of which must commit together (a bridge-free reshape must land atomically).
- **Rationale.** Design §6.B — the A1/A2 seam is leaky: `split_tier`→RowGroup and weight-exotics→Modifier mean A2's seed needs A1's entities, AND A1 would author throwaway synthetic Modifier/RowGroup entries just to satisfy the coverage gate A2 reworks; A1 must also stub the WHOLE seed so `db:reset` passes (the bridge-free 500 risk applies regardless); the house budget is ONE full `/feature` this session; aggressive-bridge-free tolerates intermediate RED trees, so the A1-green-checkpoint discipline buys nothing.
- **Consequences.** >30 files in one PR (expected for a bridge-free reshape that must land atomically; the actual diff = 303 files, net −11656 LOC). The batches are the reviewable-commit structure.
- **Reversibility.** N/A (process).

### DR-W4-PAIRED — kill `explicit_split.pairedRowId` inline

- **Status:** RATIFIED (2026-06-13, W4-model build — premise verified dead in code, the DR-W2-5 cousin).
- **Decision.** Remove `pairedRowId` from `side.ts` `explicit_split` (`{kind, side}` only) + the `explicitSplit` seed helper's optional 2nd arg + its callers.
- **Verification.** A dead sibling-ref. Seed producers DID pass it (`week-2-tuesday-compounds.ts:59,82` passed `CMP_LEFT_REF`/`CMP_RIGHT_REF`) — but those compound rows become row-group members in the re-expression, and `pairedRowId` carried NO live read (no mapper/render/guard consumed it; an inert passthrough — the DR-W2-5 premise). The seed callers drop the arg as part of the compound→row-group re-expression; platform consumers carried it in draft types only.
- **Rationale.** D-2 forbids sibling→sibling refs; manifesto 2.11 + the project's inline-fix rule (it is in the touch zone — `side.ts` is reshaped this wave).
- **Reversibility.** Easy.

### DR-W4-RG-CREATE — row-group create wraps EXISTING contiguous rows (`{schemaId, rowIds[], notes?}`)

- **Status:** RATIFIED (2026-06-13, W4-model build).
- **Decision.** Unlike schema-group create (which authors brand-new track schemas), row-group create takes `rowIds: string[]` (≥2, unique) of rows ALREADY in the schema, sets their `rowGroupId` in a Serializable tx (`retryOnP2034`), asserts contiguity (`assertRowGroupMembersContiguous` over the schema's ordered rows), returns `{group, members: SchemaRow[]}`. It rejects foreign-schema rowIds (BadRequest `foreignIds`) + non-existent rowIds (BadRequest `missing`). The seed authors row-groups DIRECTLY via Prisma (members written with `rowGroupId`), like it authors 1-member schema-groups.
- **Rationale.** The corpus cases (compound `+` / `OR` / per-set) group rows that already exist; the schema-group "tracks author new ladders" model doesn't fit.
- **Consequences.** The create response embeds `members: SchemaRow[]` (the box renders immediately — the DR-W2-FORK-2 precedent). W4-editor wires the gesture; W4-model needs the route to compile + the seed to use the direct-Prisma form. An empty row-group is dropped by `buildRowItems` (members===0 filter), mirroring the schema-group last-member auto-drop. `delete` = `verifyRowGroupOwnership` + editable + `prisma.rowGroup.delete` → `SetNull` dissolves (rows survive with order intact). **Latent edge deferred to W4-editor (W4R-001/QA-002):** create does NOT reject a rowId already in another group — it silently re-homes the row and can orphan the old empty group (non-destructive; not reachable in W4-model — the seed authors directly, no gesture exists yet).
- **Reversibility.** Easy (request-shape change).

### DR-W4-MAPPER-INPUT — `mapToSchemaRow` / `mapToSchemaWithBody` input types gain the modifier + rowGroup includes

- **Status:** RATIFIED (2026-06-13, W4-model build — design §7).
- **Decision.** `mapToSchemaRow` requires `PrismaSchemaRow & {modifierAssignments: (… & {modifier})[]}` (`PrismaSchemaRowWithModifiers`); `mapToSchemaWithBody` requires `rows` with that include + `rowGroups: PrismaRowGroup[]`. A single shared `SCHEMA_BODY_INCLUDE` const (`endpoints/lms/_shared/schema-body-include.ts`) supplies the include at EVERY call site (week GET, the schema-row create/update tx re-load, the row-group create members re-load).
- **Rationale.** The modifier embed + the row-group embed are read-path requirements; the mapper input type must reflect them or `mapToSchemaRow(r)` won't typecheck. ONE shared include const = no drift across the three sites.
- **Consequences.** Three include sites unified; `assertComposeTreeValid`'s input (a `SchemaWithBody`) now carries `rowGroups` (ignored by the projector — fine).
- **Reversibility.** N/A.

### DR-W4-SWB — `schemaWithBodySchema` extended to `{schema, rows, rowGroups}`

- **Status:** RATIFIED (2026-06-13, W4-model build — design §7).
- **Decision.** Add `rowGroups: z.array(rowGroupSchema)` to `schemaWithBodySchema` — the one-floor-down analogue of `Block.groups` — so `buildRowItems(rows, rowGroups)` has its input on the read path.
- **Rationale.** `buildRowItems` is the SOLE clustering source (red line #4); the rowGroups must travel with the schema body exactly as `Block` carries both `schemas` + `groups`.
- **Consequences.** Every producer of `SchemaWithBody` supplies `rowGroups` (the mappers do); the compose-projection ignores it.
- **Reversibility.** N/A.

### DR-W4-TEMPO-SHAPE — `tempoModifierSchema` collapses to `fullTempoSchema`

- **Status:** RATIFIED (2026-06-13, W4-model build — design §7).
- **Decision.** With the four verbal forms dead, the wrapper object has one surviving key — collapse `tempoModifierSchema` to `fullTempoSchema` (each position `z.union([z.number().int().min(0).max(60), z.literal("X")])`). The row's `tempo Json?` is the 4-digit tempo DIRECTLY (no `.fullTempo` wrapper).
- **Rationale.** A wrapper around one field is inert (D-TEMPO; the byProfile precedent for typed-awaiting-an-engine). `X` is a real corpus value (explosive concentric).
- **Consequences.** `tempo.ts` exports `fullTempoSchema` as the tempo type; the verbal seed helpers die → re-express as MODIFIER refs. Consumer breakage fixed in the same wave: `format-tempo.ts` (`tempo.fullTempo.eccentric` → `tempo.eccentric`; the four verbal branches dropped) + the platform tempo editors (deleted, W4-editor rebuilds). The mapper `tempoModifierSchema.parse(r.tempo)` is unchanged (the schema NAME persists; the shape collapses).
- **Reversibility.** Easy.

### A3 seed-ambiguity resolutions (under DR-W4-3 / the seed re-expression)

The seed re-expression surfaced four ambiguous corpus shapes; resolved faithfully to the ratified design (all sanity-checked by Review + QA, no coach-meaning dropped beyond the by-design structured→notes relocations of D-EXEC-DEFER / D-FLOORS):

1. **Row-group membership = `memberRowRefIds` on the schema node** (`canonicalRowGroupSchema`) — the node-local `rowIdsByRef` map in `emitSchemaNode` resolves refs → ids, throwing on an unknown ref.
2. **Per-row intensity/pace variance → one representative to `schema.intensity` + the rest to notes** (`phase-7-blocks.ts` `BLOCK_NUMERIC_PACE_ROW`/`BLOCK_SNATCH_WAVE`) — a structured→text downgrade that IS faithful to the ratified design (row-level intensity override killed; intensity is schema-only; per-row variance is channel-3 notes per D-EXEC-DEFER). Data preserved as human-readable notes, not dropped (W4R-002).
3. **Block timeCap colliding with a rounds-schema → a schema note** (`BLOCK_PULL_UP_CLUSTER` "15 sec cap", `BLOCK_PER_ROUND_MARKERS_WK2_TUE` "10 min cap") — the `repetition` axis holds ONE kind; a schema already on `rounds(N)` cannot ALSO be `repetition.timeCap`, so the note is the only faithful option without a second axis (out of scope) (W4R-003).
4. **`single_arm` → `eachArm()` side** (`week-2-monday-strength.ts` BSS: `count:1 + side: eachArm() + fromSofa`) — confirming the `single` + `single_arm` MERGE (one-arm = SIDE, not a weight format). Minor inconsistency: `week-2-monday-weights.ts` st-1 (a split-tier member) uses `count:1` with no side — cosmetic, not a loss (W4R-004).

---

## W4-editor implementation calls (W4E-F\* + DR-W4E-\*) — the proto-faithful row authoring UX over the W4-model leaf

W4-editor builds the AUTHORING half of W4: the row form (exercise-select-first), the searchable create-on-the-fly modifier picker, the row-group box + select-mode grouping gesture, the notes multi-list editor, `sets`/`count` authoring, and in-group schema header parity. It does NOT rebuild W3 (schema-group box, `AxisEditorModal`, `buildBlockItems`) or W4-model (contracts, Prisma, seed) — it adds ONLY the leaf, plus exactly ONE api-server endpoint (the coach modifier-create, F1/D3). Platform-only EXCEPT that one crossing. Ratified during the W4-editor `/feature` (full) build (2026-06-13, branch `feat/session-primitive-w4-editor`, **13 commits** `abf09986..12662e98`). NOT a new one-way door — rides **ADR-0041** (no new ADR; these DR-W4E-\* are the §7 decision record of `.feature-dev/1781372008/design.md` with the in-build deviations + the Stage-5-6 fix-loop folded in). All runnable gates green: `check-types` 16/16, `lint` clean, `dep:check` 0, **platform vitest 699/699** (78 files; +110 tests from the dedicated test stage). The D3 endpoint test is written; the OWNER runs the gated api-server suite at merge (no `db:reset`/seed needed — D3 adds no schema/data). **The §6 owner browser walkthrough (jsdom-blind to DnD/pointer/modal) is the REAL acceptance gate, POST-merge.**

### Pre-resolved forks (owner-ratified inputs — the design built AROUND them; Gate A did not re-litigate)

#### W4E-F1 — INCLUDE create-on-the-fly modifier (the coach modifier-create endpoint)

- **Status:** RATIFIED (2026-06-13, owner — design §7 F1; the wave's single platform-only-boundary crossing).
- **Decision.** D3 (the coach modifier-create endpoint mirroring `cmsModifierAdminApi.createModifier` + `requireCoachLikeRole`) + the synthetic "Create «query»" option in D2's picker. NO Prisma/seed/contract-shape change.
- **Rationale.** D-MODIFIER — the searchable create-on-the-fly picker IS the wave's rationale; a coach must mint a modifier inline without leaving the editor. A search-only picker guts the live WRITE projection (typing "from sofa" 27×/plan = coach-daily-UX pain №1).
- **Consequences.** One new api-server endpoint + route + client + hook; the picker carries the async-mint path. The gated api-server suite at merge is the only ritual (no reseed — additive endpoint).
- **Reversibility.** High — the endpoint is additive; remove the synthetic option to revert to search-only.

#### W4E-F2 — NotesListEditor editing `string[]` directly, retiring `notes-list-text.ts`

- **Status:** RATIFIED (2026-06-13, owner — design §7 F2).
- **Decision.** A `NotesListEditor` mandatory in the row modal; adopt it for the inline schema/block/group/session/day notes; the inline carriers commit via a new `NotesListField` blur-commit wrapper; keep `compute-day-stats.ts`'s join (a derive, not an editor). `notes-list-text.ts` RETIRED (grep zero).
- **Rationale.** W4R-005 — the `textToNotesList`/`notesListToText` round-trip helper collapses a multi-note list to one; editing `string[]` directly removes the conversion and the bug.
- **Consequences.** Touches the 7 `notes-list-text` consumers + the inline carriers; the join survives inline only where a summary is derived (`compute-day-stats` + the rest-day/session-head read-only displays).
- **Reversibility.** Medium — the helper retirement is a one-way cleanup, but each carrier swap is independently revertible.

#### W4E-F3 — select-mode grouping; reject already-grouped + non-contiguous client-side

- **Status:** RATIFIED (2026-06-13, owner — design §7 F3).
- **Decision.** "Group rows…" → checkboxes on ungrouped rows → bottom bar → wrap EXISTING contiguous rows; guard = already-grouped rows STRUCTURALLY unselectable (they render inside `RowGroupBox`, no checkbox — W4R-001 client) + a client contiguity check (DR-W1-5 parity message "Selected rows must be next to each other"). v1 gesture set = wrap / ungroup / delete-with-rows / edit-label; **add-to-existing is OUT** (no contract path — `createSchemaRow` strips `rowGroupId`, pinned by `schema-row.schema.test.ts:148`).
- **Rationale.** DR-W4-RG-CREATE — create wraps existing contiguous rows; the select-mode is the proto gesture (the mirror of the prototype's block "Group schemas…"); the guards keep the create from silently re-homing/orphaning and from leaking the server BadRequest.
- **Consequences.** `SchemaRowList` gains select-mode state + a bottom bar; `SchemaRowCard` gains optional select props (default off → zero behaviour change); four new row-group hooks.
- **Reversibility.** High — select-mode is additive UI; the hooks wrap existing endpoints.

### Fresh design decisions (the RFC + the Stage-5-6 fix-loop)

#### DR-W4E-FORM-STATE — the row form uses a controlled state object, NOT react-hook-form

- **Status:** RATIFIED (2026-06-13, W4-editor build — design §6 A1).
- **Decision.** `row-editor-modal.tsx` matches `AxisEditorModal` (`useState<RowFormState>` + a `modeKey`-driven `useEffect` reset + an `isSubmittingRef` synchronous submit guard), NOT react-hook-form.
- **Rationale.** In-module precedent (the same module's existing modal uses a controlled draft) + the leaf is a discriminated-union tree (load/reps/side) that RHF's flat field-path model fits poorly; introducing RHF would create two form paradigms in one module.
- **Reversibility.** Medium — could migrate to RHF later if forms proliferate.

#### DR-W4E-PICKER-LOCAL — the modifier picker lands platform-local, generic-prop'd

- **Status:** RATIFIED (2026-06-13, W4-editor build).
- **Decision.** `modifier-picker.tsx` lands platform-local (NOT `@repo/ui`), with a generic `CreatableMultiPickerProps` contract shaped so a label variant can pass `useLabelSearch`/`useCreateLabel` later (the LABEL-FLOW-UX requirement). v1 a thin `ModifierPicker` injects `useModifierSearch` + `useCreateModifier`.
- **Rationale.** Exactly one consumer this wave (the row modal); promote to `@repo/ui` when LABEL-FLOW-UX adds the second consumer (DR-W3-2 "don't restyle-shared-for-one-caller"). `MultiSelect` is fixed-options (select-all sentinel, no freeSolo) — a build, not a reuse.
- **Reversibility.** Easy — additive promotion.

#### DR-W4E-NOTES-LOCAL — NotesListEditor lands platform-local

- **Status:** RATIFIED (2026-06-13, W4-editor build).
- **Decision.** `notes-list-editor.tsx` (+ the `NotesListField` blur-commit wrapper) land platform-local; the inline carriers are all in plan-detail.
- **Rationale.** Same as the picker — promotable to `@repo/ui` if another app needs it.
- **Reversibility.** Easy.

#### DR-W4E-EXERCISE-LOCK — `exerciseId` is create-only; the Edit-mode picker is disabled

- **Status:** RATIFIED (2026-06-13, W4-editor build — confirmed at Gate A).
- **Decision.** `updateSchemaRowSchema = createSchemaRowSchema.omit({schemaId, exerciseId}).partial()` — the contract has no `exerciseId` on update; the row's exercise is fixed. The Edit-mode exercise picker is shown disabled; to change the movement the coach deletes + re-adds.
- **Rationale.** Faithful to the contract (the `.omit` is the source of truth). On edit EVERYTHING else (load/reps/side/tempo/modifiers/notes) IS editable; only the exercise is locked.
- **Reversibility.** Only with a contract change (out of scope).

#### DR-W4E-RG-ORPHAN — delete-with-members leaves the empty RowGroup row

- **Status:** RATIFIED (2026-06-13, W4-editor build).
- **Decision.** `use-delete-row-group-with-members.ts` deletes each member row and does NOT delete the now-empty `RowGroup` row; `buildRowItems` drops empty groups from the render so the box disappears.
- **Rationale.** Parity with the schema-group precedent (`use-delete-group-with-members.ts`, which relies on the same drop-empty render); an orphan `RowGroup` row is harmless to render.
- **Consequences.** File orphan-group cleanup as a deferred hygiene item if it ever matters.
- **Reversibility.** Easy — append a final `api.rowGroups.delete` after the rows.

#### DR-W4E-ROW-REORDER — row reorder is WIRED this wave (Gate A change to the original plan)

- **Status:** RATIFIED (2026-06-13, Gate A — owner approved WIRE; the RFC's rec was to LEAVE it unwired).
- **Decision.** Row reorder is wired: a row-floor `DndContext` + `SortableContext` over the `buildRowItems` items in `schema-row-list-body.tsx`, mirroring `block-card-body.tsx` one floor down. The mixed-height row↔row-group list uses `pointerFirstCollision` (DR-W3-11); the composite sortable-id has a single source (`row-item-sortable-id.ts`). Group-contiguity is preserved BY CONSTRUCTION: a row-group is ONE `RowItem` in `sortedItems`, `arrayMove` moves whole items, and `nextOrder.flatMap(itemMemberIds)` emits each group's members adjacently.
- **Rationale.** Design §6 A4 surfaced a design-time finding: row reorder was NEVER wired (`SchemaRowCard` had an orphan `useSortable`, `useReorderSchemaRows` was unconsumed, no `SortableContext`) — so red line #7 ("don't regress row reorder") was FACTUALLY WRONG (the runner-prompt's premise; code wins, manifesto 2.11). The §6.9 evil-fixture build wants reorder by hand → the owner approved wiring it at Gate A as an additive block rather than shipping a dead drag handle.
- **Consequences.** Introduces the row↔row-group mixed-height DnD (the interaction layer the §6 walkthrough gates); the server row reorder has NO contiguity guard (DR-W4E-ROWREORDER-CONTIG-SERVER — deferred, latent, unreachable from the UI by construction).
- **Reversibility.** Additive — drop the `DndContext`/`SortableContext` to revert to the orphan handle.

#### DR-W4E-W4R-001-CLIENT — the row-group overlap guard is client-only this wave

- **Status:** RATIFIED (2026-06-13, W4-editor build).
- **Decision.** The already-grouped-row guard is client-only: grouped rows render inside `RowGroupBox` (structurally unselectable, no checkbox), so a grouped rowId CANNOT reach `api.rowGroups.create` from the UI. The server `createRowGroupWrapping` `updateMany` keeps NO `rowGroupId !== null` check — a latent server re-home/orphan gap, ratified as a fast-follow.
- **Rationale.** The rendering split is the structural guarantee; adding the server reject re-arms the gated api-server suite (~10 min owner ritual) for a path the UI can't trigger. Belt-and-suspenders (both) only if the owner asks.
- **Consequences.** W4R-001-SERVER carried forward in `deferred.md` (server backstop).
- **Reversibility.** Additive — the server reject is a one-line filter + a test.

#### DR-W4E-COACH-ISSUE — the row form surfaces coach-friendly validation (NEW, from the Stage-5-6 fix-loop)

- **Status:** RATIFIED (2026-06-13, W4-editor build — the fix-loop closing QA-001/QA-002/QA-003).
- **Decision.** The row form surfaces coach-friendly validation via a `coach-row-issue` mapper (NOT raw zod paths); invalid sub-field seeds are `NaN`-empty (render blank, not a misleading `0`); `submitDisabled` blocks Save while invalid; optional numerics clear to absent.
- **Rationale.** QA found three CRITICALs as one cluster: (QA-001) `formatZodIssue` leaked `path: message` to the coach (e.g. `entries.0.label: String must contain at least 1 character(s)`); (QA-002) no submit-blocking on invalid discriminant state → invalid loads/reps reached `safeParse` and bounced with the cryptic message; (QA-003) the `kg:0`/`value:0`/empty-label defaults were invalid the instant a load kind was chosen (the most common path "add an absolute load" was a guaranteed bounce). coach-daily-UX is the project's #1 bar — a coach must be stopped at the offending field with prose, never see a machine path. This supersedes the gap where `formatZodIssue` leaked raw zod issues to the coach.
- **Consequences.** The pure `build-row-request` validation surface + the sub-field seeds + the `FormModal submitDisabled` wiring are all touched; the new behaviour is jsdom-pinned in the test stage.
- **Reversibility.** N/A (a UX-correctness fix; no reason to revert).

#### DR-W4E-PICKER-MINT-TOLERANT — create-on-the-fly catches per-mint rejection (NEW, QA-008)

- **Status:** RATIFIED (2026-06-13, W4-editor build — the fix-loop closing QA-008).
- **Decision.** The picker's mint loop catches per-mint rejection: on a failed `useCreateModifier.mutateAsync` it keeps the existing selection, skips the failed mint, and surfaces no unhandled promise (still `onChange`-commits the successfully-resolved ids).
- **Rationale.** QA-008 — a mid-loop mint failure (network/P2002/429) propagated out of `handleChange`, was discarded by `void handleChange(...)`, and skipped the whole `onChange` → the coach silently lost the selection they just made. A try/catch around the mint preserves what worked.
- **Reversibility.** N/A (a robustness fix).

#### D7 — in-group schema header parity (supersedes DR-W1-3)

- **Status:** RATIFIED (2026-06-13, W4-editor build — implements D-HEADER-KEEP; supersedes DR-W1-3).
- **Decision.** `schema-card-head.tsx`'s `!isBoxed` gate on the title row (composition chip + `InlineEditText` title) is REMOVED — an in-group (boxed) schema renders its header identically to a standalone schema. The drag handle stays gated on `isDraggable` (a separate flag — boxed members are non-draggable, correct and unchanged). Render-only; no model/contract change.
- **Rationale.** D-HEADER-KEEP (owner: "хедер схемы в группе [должен] выглядеть так же как хедер схемы без группы"). DR-W1-3 suppressed the in-box schema head under the W1 derived-parallelism model; D7 reverses that for the schema floor now that the box is an explicit `SchemaGroup` with its own opaque label zone. "In-group" = a schema inside a schema-GROUP (the W3 box, via `GroupTrackWrapper`); the row-group box renders rows, not schemas, so header parity is a schema-floor concern only.
- **Consequences.** Closes W4-HEADER-PARITY (`deferred.md`). The now-dead `isBoxed` prop on `SchemaCardHead` is a leftover (CODE-003 INFO — optional cleanup).
- **Reversibility.** Easy (re-add the gate) — but it would re-break D-HEADER-KEEP.
