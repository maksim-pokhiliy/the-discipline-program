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
| D-MARKER-DEATH      | `INNER_LADDER_MARKER` dies; rep-scheme ladder = one-row ladder-schema in Group   | **OPEN** |
| DR-W1-1 BOX-RENDER  | Parallel parent → `AccentGroupCard` box gated by the live one-predicate          | RATIFIED |
| DR-W1-2 CHECKBOX    | «Group into one box» = submit-branch flag; unchecked → N non-atomic flat creates | RATIFIED |
| DR-W1-3 HEAD-DEDUP  | Boxed parent: chip+title suppressed; `header` shown once in the box label zone   | RATIFIED |
| DR-W1-4 COPY        | Checkbox copy = English "Group into one box" (Gate A)                            | RATIFIED |
| DR-W1-5 INDEP-VALID | Unchecked path validates ladder steps client-side, coach-message parity (Gate B) | RATIFIED |

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

### D-MARKER-DEATH — `INNER_LADDER_MARKER` dies (proposal)

- **Status:** **OPEN** (proposed 2026-06-10; explicitly asked, not yet answered by owner).
- **Proposal.** The marker row kind (38 corpus occurrences, ~15 schemas, no authoring flow — MARKER-FATE inherited) is removed. Its case — per-track single-movement rep-scheme ladders (Block C `21-15-9 ‖ 9-15-21`) — re-expresses as N one-row ladder-schemas inside a Group. D-LADDER's semantic distinction (shared round-counter vs per-track rep-scheme) SURVIVES as two different STRUCTURES (one ladder-schema with N rows vs a Group of N one-row ladder-schemas) instead of two different fields; the forbidden-fusion guard and QA-001 collision die as unrepresentable.
- **Why it needs explicit ratification.** It supersedes the "D-LADDER is sacred / do NOT remove the marker" clause carried by both predecessor initiatives — mechanism superseded, semantics preserved. Do not execute past this without the owner's yes.

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
