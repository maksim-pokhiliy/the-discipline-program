# plan-editor-compose — theory ↔ code reconciliation

**Created:** 2026-06-05 · **Type:** analytical artifact (read + synthesis, no code changes)

Сверка ПРЕДПОСЫЛОК/ТЕОРИИ compose-миграции (web-Claude origin dialogue + durable artifacts: ADR-0037, `algebra-spec.md`, `decisions.md`) против РЕАЛЬНОГО shipped-кода после того, как core-arc 10.0–10.4 смержен в `main` (PR #245, `c20c082a`). Дисциплина: verify-not-trust — каждое утверждение стоит на открытом файле + verbatim `file:line`, не на памяти. Ратифицированное расхождение (`decisions.md`) ≠ дрейф — сверено ПРЕЖДЕ чем звать «gap/drift».

---

## Метод

- **Теория (читана сама, verbatim):** ADR-0037, `algebra-spec.md`, `decisions.md` (все D), `charter.md`, `deferred.md`, `phase-c-seed-conversion.md`, `journal.md`, `10-4-recon.md`, `plan.md`, `state.md`; контракт-ядро `@repo/contracts/.../lms/composition/{composition.schema,types,constants,label,index}.ts`. Web-Claude origin-простыня — как первичные предпосылки (four-projection legitimacy test, scoring = Sheets-дифференциатор, 8-primitives→4-axis).
- **Код (5 параллельных читателей, verbatim):** (1) composition contract-тесты; (2) api-server compose-layer (mapper + write-guards + inert-scan); (3) seed composition-native (builder + canonical + coverage + plan-synthetic); (4) platform compose UI (оси + lib + draft types); (5) `.feature-dev/` reasoning-слой (12 timestamp-runs, gitignored).
- **Self-verify (orchestrator, verify-not-trust):** conditional-scoring UI-grep, gauntlet Block-C presence, minute-view wiring, seed-gap greps (`stagedProgram`/`once`/`range`/`prescribed`/`for_time`/`until_recovery`/`INNER_LADDER_MARKER`). **Поймал один over-claim читателя** (until_recovery — см. §verify-note внизу).

---

## Bottom line

**Код faithful теории; жёсткого непреднамеренного дрейфа НЕТ.** Четыре независимых читателя кода (contract/api-server/seed/platform) сошлись: archetype вырезан across all layers, scoring present-but-inert (тройной guard), kind-guards abolished auth-neutral, четыре оси заморожены ровно по алгебре. Все расхождения от ИСХОДНОЙ web-Claude теории — **ратифицированы** (D-INTERVAL, D-LADDER, DEFER-001, D-10.4-2, D-UNTILREC, REVIEW-005) и documented с rationale.

Незакрытое — это **gaps, не drift**, двух сортов: (1) **ph.5 scoring/execution** (declared OUT-of-scope — но обнаружен ВТОРОЙ слой gap: для conditional-scoring отсутствует не только execution, но и **authoring-вход** в UI, при том что контракт поле заморозил); (2) **фикстурная неполнота** — сид упражняет 6/8 repetition + 4/6 scoring + 0 stagedProgram-stages + 0 INNER_LADDER_MARKER; Gauntlet Block C нигде не собран в полную форму end-to-end.

Плюс **promotion-дисциплина**: 3 forward-стоящих INFO-находки из `.feature-dev` (про архитектуру write-guard) умерли в скретче без durable-дома — кандидаты в `deferred.md`.

**Хорошая новость для ph.5:** контракт УЖЕ заморозил ВСЕ данные для scoring-execution (condition.appliesToRounds + interleaveOrder + parallel.tracks) — следующая инициатива не трогает контракт для чтения, только снимает tripwire + пишет evaluator.

---

## (a) КОД ВЕРЕН теории — FAITHFUL

### Контракт (FROZEN `@repo/contracts/.../lms/composition`)

- **8 repetition-примитивов точь-в-точь** с границами теории: `once · count(exactOrRange) · range(min<max) · ladder(steps[]≥1, positive) · timeCap(cap) · cadence(everyMin,rounds,totalMin?) · window(startHhMm,endHhMm, start<end) · interval(workMin,offMin≥0,count)` — `composition.schema.ts:37-97`, `composition.constants.ts:1-10`. Алгебра §2.2 + D-INTERVAL.
- **arrangement** `ordered | parallel(interleaveOrder, tracks≥2{childSchemaId, setEnumeration?, pairedWithRowId?}, distinct ids) | superset(pairs≥1{label, rowIds≥2 distinct})` — `composition.schema.ts:99-147`. Сохраняет D-ALTGROUP-FOLD данные (setEnumeration/pairedWithRowId/N-ary).
- **scoring (6)** `prescribed | amrap | for_time | max_in_remaining | total | progressive(seed)`, каждый кроме prescribed несёт `condition: {appliesToRounds[]≥1}.optional()` — `composition.schema.ts:149-170`. **Conditional-scoring СТРУКТУРА заморожена как данные** (Gauntlet D).
- **`.strict()` на всех осях** (D-STRICT) — unknown keys reject — `composition.schema.ts:39-181`.
- **QA-001 ladder-collision `superRefine`** на `composeContainerSchema`: контейнер с `repetition:ladder` И ребёнком-row `INNER_LADDER_MARKER` → reject — `composition.schema.ts:235-251`. Это материализация D-LADDER split.
- **Container-принимает-любого-ребёнка + рекурсия** — `children: z.array(composeNodeSchema)` гетерогенно; recursion exercised 8-deep в тесте. Алгебра §2.4 инвариант.
- **kind/family computed-on-read, никогда не хранятся** — `deriveCompositionLabel` чистая фн, 9-kind/7-family compose-native enum (НЕ 34 archetype names), `deriveKind` структурно не читает `scoring` → scoring не влияет на label — `composition-label.ts:5-87` (D-LABEL, OQ-1).

### api-server compose-layer

- **Write-guards выжили ровно как ратифицировано:** `assertComposeTreeValidForWrite` (400 `BadRequestError`, in-tx rollback на schema-row create) — `compose-projection.mapper.ts:49-62`, hooked `schema-row/admin.ts:122,180-185`; `assertCompositionUpdateValid` — `schema/assertions.ts:44-82`; **QA-004** `assertArrangementRefsInScope` existence/scope-only, **zero extra queries** (id-sets из уже загруженного `current`) — `schema/assertions.ts:7-42`. Read-time `assertComposeTreeValid` → 500 DbCorruption — `compose-projection.mapper.ts:33-47`.
- **mapToSchema archetype-free** — читает `id/blockId/parentSchemaId/order/header/intensity/composition` + derives label; ноль archetype/kind/archetypeParams — `schema.mapper.ts:17-33`. Null-composition lift `?? {}` — `compose-projection.mapper.ts:24-31`.
- **scoring inert на сервере** — grep `scoring`/`appliesToRounds` по `api-server/src` (excl tests) = ZERO consumers; хранится в `Schema.composition` Json через generic marshal, лейблится в contracts. Ни одного `computeScore`/`evaluateScoring`/`score(`.

### scoring present-but-inert — ТРОЙНОЙ guard (type + 3 теста, не comment)

1. **contract** `composition-scoring-inert.test.ts` — `isFunctionFree` рекурсивный walk по всем 11 вариантам (incl condition) + parse-boundary reject функции в seed (`composition.schema.test.ts:322-326`).
2. **api-server** `scoring-inert-consumers.test.ts` — source-scan `src/mappers/lms/` + `src/endpoints/lms/schema/` на `EXECUTION_SYMBOL_PATTERNS = [/\bcomputeScore\b/, /\bevaluateScoring\b/, /\bscore\s*\(/]`, offenders === [].
3. **platform** `scoring-axis-is-inert.test.ts` — no-function + label-not-number + source-scan `compose/`.

Алгебра §6 «инертность через тип+тест, не комментарий» — реализовано буквально.

### seed composition-native

- `CanonicalSchemaNode.composition` REQUIRED; archetype/kind/alternatingGroupRef/trailingConnector ушли из типа + zod — `canonical-schema.ts:202-224`. Grep archetype в `plan-data` = zero (только DEAD-banner `coverage-matrix.md` + legitimate axis-discriminant).
- **Two-phase arrangement back-patch** (refId→cuid via `cuidFromSeed`; strip-on-create → register children → whole-composition patch) — `schema-emit.ts:58-95` + `schema-emit-back-patch.ts` + `ref-resolver.ts`. Работает: parallel×4, superset×2.
- **coverage gate per-axis**, archetype/schemaKind cells удалены — `coverage-cells/composition.ts:8-12` (repetition×6, arrangement×3, scoring×4, rest, composition.present floor≥40); `CoverageCategory` без archetype/schemaKind — `types.ts:3-30`.
- **conditional-scoring реально засеяна** — `week-1-wednesday.ts:151` (block-142): `scoring:{kind:"max_in_remaining", condition:{appliesToRounds:[2,3]}}`.

### platform compose UI (productionized prototype, persistence wired)

- **repetition 7/8 авторятся** прямыми toggle (once/count/ladder/timeCap/cadence/window/interval) — `repetition-axis-field.tsx:33-41`; interval/cadence/window/ladder — полноценные sub-поля. (range — folded-into-count, см. (b).)
- **parallel/superset = selection-over-existing-descendants** + two-phase persist + ref-remap-on-clone — `parallel-arrangement-fields.tsx:140`, `superset-arrangement-fields.tsx:105`, `use-persist-compose-cascade.ts:77-107`, `arrangement-resolve.ts`. D-10.4-S2-R2 точно.
- **deriveMinuteView** computed-on-read, mod-cycling, never stored — `derive-minute-view.ts:9-23` (D-EMOM-UX). _(wiring-нюанс → (d).)_
- **shouldBeContainer** = 4-факторный affordance hint (repetition∨arrangement∨scoring∨>1child), не reject, не stored — `should-be-container.ts:10-18`, единственный consumer `compose-container-inspector.tsx:85` (demote-hint Alert). D-CONTAINER-VS-ROW.
- **ladder split в UI** — container `repetition:ladder` + row `INNER_LADDER_MARKER` оба авторятся — `repetition-axis-field.tsx:36`, `row-kind-picker.tsx:74-82`.

### Gauntlet acceptance (контракт-тесты, executable)

- **B/D/A/E + 8-deep recursion** собираются как `composeContainerSchema` + валидируют — `composition-gauntlet.test.ts:53-390`. Gauntlet D несёт `scoring.condition.appliesToRounds:[2,3]` (`:170-174`).
- **four-projection ladder** — Fran (shared container ladder над 2 движениями) + Block C (per-track INNER_LADDER_MARKER) + fused-collision reject — `composition-ladder.four-projection.test.ts:69-167`.
- **fold** — setEnumeration + pairedWithRowId поглощаются на track; steps/direction на track reject; legacy `pairedWithInnerRowId` reject — `composition-fold.test.ts`.

---

## (b) ОСОЗНАННОЕ расхождение от исходной теории — RATIFIED DIVERGENCE

| #   | Что отошло от web-Claude/algebra origin                                                                                                                                                                                                                                                      | Ратификация                                                                                                                                                                                                                                                                                           | Код-подтверждение                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **`interval` добавлен 8-м repetition-примитивом** — в origin algebra §2.2 таблице его НЕ было (но §2.5 им уже пользовался — внутренняя нестыковка спеки, закрыта).                                                                                                                           | **D-INTERVAL**. Полный four-projection (SET=work:rest ratio как единое понятие Tabata 20:10; EXECUTE=непрерывный duty-cycle ≠ дискретные раунды; ANALYTICS=ratio как измеримое, невосстановимо из count+timeCap+rest; RENDER=work/rest bar) — verbatim в `.feature-dev/1780402567/design.md:202-209`. | `composition.schema.ts:75-82`, `constants.ts:8`                                                                                |
| 2   | **`ladder` split на ДВА примитива; web-Claude гипотеза «RepNotation VO» OVERRIDDEN** в пользу существующего `INNER_LADDER_MARKER`.                                                                                                                                                           | **D-LADDER**. Three-prong аргумент (1: sacred leaf — RepNotation edited `_shared` VO + ripple всех consumers; 2: semantic fit — RepNotation = reps одного сета, не multi-set sequence; 3: research confirms модель уже разделяет) — verbatim в `.feature-dev/1780426624/design.md:346-355`.           | round-counter `composition.schema.ts:53-58`; rep-scheme row `INNER_LADDER_MARKER`; collision `superRefine:235-251`             |
| 3   | **`program` (StagedProgram) — НЕ sacred Row-VO**; algebra §1 числил его среди sacred Json-VO листьев — это ОКАЗАЛОСЬ НЕВЕРНО (всегда был archetype-param). → 5 named-program + emom-slot nodes → flat `{}`; stagedProgram VO **ноль инстансов** в сиде.                                      | **DEFER-001 / DR-C2 (D-10.4-S3-C)**. «algebra §1's "program is a sacred Row-VO" was WRONG — it was always an archetype param». Открытие: grep confirms NO programKind/stagedProgram stuffed anywhere — `.feature-dev/1780601689/qa.md:116`.                                                           | seed: `stagedProgram` grep = ∅; `week-1-friday.ts:45-72` (bench wave→flat{}), `phase-7-blocks.ts:141-169` (snatch wave→flat{}) |
| 4   | **`Schema.kind` dropped + write-guards abolished** (`assertParentKindForRow`/`assertSubSchemaInvariants`/`assertArchetypeConsistency`); ownership guards перестали возвращать kind/schemaKind. Поведение: row в grouping-container + sub-schema под любой parent теперь accepted (было 400). | **D-10.4-2**. AUTH-NEUTRAL доказано byte-identically: allow/deny chain `if(!schema∨deletedAt) throw · if(creatorId===userId) return · resolveCallerRole→isAdminOrHeadCoach · throw Forbidden` — kind никогда не участвовал — `.feature-dev/1780637704/review.md:88-98`.                               | grep abolished guards в api-server = ∅; `authz/lms-guards.ts` все 5 return-shapes структурные                                  |
| 5   | **`until_recovery` = sham convention** `{value:1,unit:"sec"}+qualifier:"until_recovery"` — origin предполагал optional-duration; `restSpecSchema.duration` mandatory → sham. «one expressiveness gap» 10.2.                                                                                  | **D-UNTILREC**. Tightening (superRefine pinning value:1) трогает FROZEN contract → deferred (QA-untilrec).                                                                                                                                                                                            | gauntlet `composition.schema.test.ts:346-360`; seed `week-1-monday.ts:62`                                                      |
| 6   | **draft `compose-tree.types.ts` ДИВЕРГИРУЕТ от frozen contract** — (a) `range` folded-into-`count` (UI авторит диапазон, эмитит под тегом count; контрактный `{kind:"range"}` из UI не родится); (b) `scoring.condition` ОТСУТСТВУЕТ в draft type + `mapScoring`.                            | **REVIEW-005** (PARTIAL, residual DEFERRED). Разные input-типы draft↔contract; full dedup заблокирован.                                                                                                                                                                                              | `compose-tree.types.ts:17-24,39-45`; `compose-to-create-requests.ts:55-56,82-99`                                               |
| 7   | **promote/demote structural BUTTON deferred** — только non-blocking demote-hint Alert.                                                                                                                                                                                                       | **D-10.4-S2** (needs inspector-API expansion).                                                                                                                                                                                                                                                        | `compose-container-inspector.tsx:85-93`                                                                                        |
| 8   | **coverage gate scoped-to-emitted-kinds** — cell-массивы перечисляют ровно засеянное (6 rep / 4 scoring); un-emitted once/range/prescribed/for_time документированы БЕЗ cell.                                                                                                                | **DR-C3** ([[no-list-caps-honest-counts]] — растить сид синтетикой = corpus-measuring анти-паттерн §0).                                                                                                                                                                                               | `coverage-cells/composition.ts:8-12`                                                                                           |
| 9   | **`rest` axis §2.2 illustrative scope OVERRIDDEN** реальным `RestSpec` (4-value `REST_SCOPES` вместо `{between\|after_each\|inside}`).                                                                                                                                                       | reuse-before-invent — `.feature-dev/1780402567/design.md:282-284`.                                                                                                                                                                                                                                    | `restAxisSchema = restSpecSchema`                                                                                              |
| 10  | **`window` name-collision разрешён** — «1-минутный EMOM-слот = duration» отклонено; EMOM sub-slots = positional child Containers под cadence, `window` = clock-range.                                                                                                                        | **D-CADENCE** (§A.4 collision) — `.feature-dev/1780402567/design.md:211-219`.                                                                                                                                                                                                                         | gauntlet B per-minute `window(00:00→00:01)` children                                                                           |
| 11  | **«8 primitives» (web-Claude) → 4-axis algebra** (repetition несёт 8 values).                                                                                                                                                                                                                | lineage, not loss — `journal.md` 2026-06-03 durability spot-check.                                                                                                                                                                                                                                    | `composition.constants.ts`                                                                                                     |

---

## (c) ТЕОРИЯ/ТРЕБОВАНИЯ НЕ реализованы — UNBUILT GAPS

### C1 — ph.5 scoring/execution layer (declared OUT-of-scope; D-PHASE5-SCORING)

Известный, ратифицированно-отложенный. Но reconciliation вскрыл, что gap **двухслойный**, и второй слой менее очевиден:

- **Execution-слой пуст** (ожидаемо): scoring axis present-but-inert; conditional-scoring (`condition.appliesToRounds`) и parallel-interleave (`arrangement.interleaveOrder`) хранятся + валидируются, но НИКТО не вычисляет. grep consumers = ∅ across all layers.
- **⚠️ Authoring-вход для conditional-scoring ОТСУТСТВУЕТ** (менее очевидный): контракт замораживает `condition.appliesToRounds` + тестирует, НО в compose-UI **ноль следов** (grep `appliesToRounds|condition` в `apps/platform/.../compose/` = **NO MATCH**, self-verified). Coach физически не может задать «AMRAP только на раундах 2-3» — поле существует в контракте, но без UI-входа. Это НЕ часть execution-gap (та про вычисление) — это отсутствие самого authoring-входа для замороженного поля. Сейчас condition попадает в данные только через seed-литералы.

### C2 — DEFER-001: program/slot row-level home (OPEN → later row-payload phase)

- Frozen contract + Prisma + S2 UI не имеют row-level дома для `StagedProgram`/`SlotSpec`. → Gauntlet A wave `[5@75,3@85,1@95]` структурно **не выразима**: в сиде схлопнута в одну row + `progressive`-маркер (`week-1-friday.ts:45-72`) или один stage-70% + текстовый header «70/80/90» (`phase-7-blocks.ts:141-169`). Потеряно: 5 стадий, rep-scheme 5/3/1, load-ramp 75→85→95.
- `stagedProgram` VO жив в `@repo/contracts/.../_shared/staged-program.ts` (programKind wave/cluster + stages[]), но в сиде **ноль инстансов** (self-verified). Даже Gauntlet-контракт держит wave как standalone VO «off the projection» (`composition-gauntlet.test.ts:242-253`) — не внутри composition-контейнера.
- **Когда добавят row-payload `program`/`slotSpec` field** (schema-row contract + Prisma column + mapper) → re-author 5 nodes + re-add 5 dropped coverage cells.

### C3 — Фикстурная неполнота (acceptance corpus уже the фикстура)

- **Gauntlet Block C нигде не собран в полную форму** «parallel-ladders→AMRAP» end-to-end: gauntlet-файл несёт B/D/A/E+recursion, но **не C** (self-verified — 5 describe-блоков, C среди них нет); four-projection файл собирает parallel-ladders-часть, но без AMRAP-хвоста. Полная §3-C форма не материализована как один блок ни в тесте, ни в сиде.
- **`INNER_LADDER_MARKER` ноль в сиде** (self-verified) — Block C rep-scheme ladder (`[21,15,9]‖[9,15,21]`) живёт только в four-projection тесте. Контракт доказал четырёх-проекционную инвариантность ladder, но row-payload-ветка фикстурой не упражняется.
- **Un-seeded axis variants** (honest coverage, scoped per DR-C3, но фикстура не покрывает всю алгебру): repetition `once`/`range` — 6/8; scoring `prescribed`/`for_time` — 4/6 (self-verified ∅).
- **Conditional-scoring широта** — в сиде 1 инстанс (`max_in_remaining+[2,3]`, block-142); 10 прочих condition-комбинаций только в contract-тесте.

---

## (d) КОД ВНЕ/ПРОТИВ теории — DRIFT

**Жёсткого непреднамеренного дрейфа НЕ обнаружено** ни одним из 4 кодовых читателей. Archetype-миграция полная, scoring инертность держится, guards abolished чисто. Это сильный позитивный итог: shipped-код = ратифицированная теория.

Пограничные пункты (formally НЕ drift — by-design/ratified — но поднимаю для владельца, могут читаться как drift):

- **`deriveMinuteView` НЕ wired в compose-prototype канвас.** D-EMOM-UX логика + тесты есть, но единственный production-consumer — `schema-row-list.tsx:61` (read-side настоящего plan-detail). На самом authoring-прототипе (`compose-container-card.tsx` рендерит `formatAxesSummary`) MIN-лейблы **не показываются** (self-verified). → coach в прототипе не наблюдает row-as-minute. Возможно by-design (прототип ≠ финальный authoring), но walkthrough-обещание «row-as-minute» на прототипе не видно. **Стоит решить: достроить в прототип или принять как read-side-only.**
- **`until_recovery` sham не enforced как инвариант** — `restSpecSchema.duration` обязателен ВСЕГДА, поэтому «until_recovery без duration» reject приходит от общего правила, не от until_recovery-специфики. Можно подать `until_recovery` с честным duration, схема пропустит — и сид это **демонстрирует**: `rest-coverage.ts:17` `restBetweenSets({value:3,unit:"min"}, "until_recovery")` (value=3min, не sham:1). Sham — конвенция, не констрейнт (QA-untilrec deferred).
- **Read-time не валидирует arrangement-ref existence** — dangling superset rowId (после удаления строки) не ловится read-time; `assertArrangementRefsInScope` только write-time через schema-update. By-design QA-004 scope-only, но referential integrity arrangement-refs держится лишь на одном write-path.
- **ladder-mutex не предотвращается в UI заранее** — свободный авторинг, reject прилетает на `compositionSchema.safeParse` при персисте (поздно, не на вводе). Согласуется с философией «свободная вкладка, reject на границе».

---

## Потерянные хвосты (`.feature-dev` INFO без durable-дома)

Promotion-дисциплина в целом **сильная**: каждый CRITICAL/WARNING из 8 проанализированных 10.x runs нашёл durable-дом. Потеряны только INFO. Из них **forward-стоящие — verified против ТЕКУЩЕГО кода** (verify-not-trust: 2 из 4 кандидатов оказались мертвы после D/E — слепое промоутирование засорило бы `deferred.md` пустышками):

- **✅ LIVE — QA-106 (S1, `.feature-dev/1780511810/qa.md:181-189`)** — `buildSchemaWithBody` hard-codes `subSchemas: []` на depth-2 — **подтверждено в `schema.mapper.ts:41`**. Если будущий шаг разрешит 3+ nesting, deep ladder-collision **evades BOTH write- и read-guard** молча (оба используют тот же projector). Latent forward-cost. → кандидат в `deferred.md`.
- **✅ LIVE — QA-108 (S1, `:201-209`)** — ladder-collision имеет **zero DB-level enforcement** — **подтверждено в `lms-checks.sql`** (только head-coach index + review-rating + enrollment-unique + schema-order; ни одного ladder-constraint). App-layer only → любой guard-bug / новый write-path / TOCTOU персистит corruption без backstop. INFO (consistent с posture проекта «правила в app-слое»), но кандидат в `deferred.md` как «на подумать долгосрочно». → кандидат.
- **❌ MOOT — QA-107 (S1, `:191-199`)** — был про обронённый triad `superRefine` на `updateSchemaSchema`. **Устарел: D/E удалили всю триаду `kind/archetypeId/archetypeParams` из контракта** — `createSchemaSchema` теперь даже не `superRefine` (`schema.schema.ts:62` — просто `= base`). Refine'ить нечего, терять нечего. НЕ промоутить.
- **❌ MOOT — QA-105 (S1, `:171-179`)** — был про новый reject на alt-group members с `archetype===null`. **Устарел: alternating-group полностью выпилен из api-server в D/E** (`grep alternatingGroup api-server/src` = ∅). НЕ промоутить.

~8 прочих INFO — cosmetic/trivial (dir `builder/archetypes/` держит compose-код = split-brain naming; `phase-7-blocks.ts` 304 LOC > 300; header drift; `pnpm --filter platform test` no-op exit-0; `key={index}`; дубль SCORING_LABELS). Деталь — `.feature-dev/` runs 1780511810 (S1) + 1780637704 (D) — **не были в карте durable docs** до этой сверки.

> **verify-note 2:** из 4 «потерянных хвостов», насчитанных reasoning-читателем, только 2 (QA-106, QA-108) живы против текущего кода; QA-107 + QA-105 verified-moot (D/E выпилили объект защиты). Второй случай за сверку, когда verify-not-trust поймал over-claim (первый — until_recovery). Промоутить в `deferred.md` стоит ровно QA-106 + QA-108.

---

## ph.5 SEED — что уже готово для scoring-execution инициативы

Самый ценный недистиллированный reasoning (`.feature-dev` раздел B). **Контракт УЖЕ заморозил ВСЕ данные для scoring-execution** — следующая инициатива не трогает контракт для ЧТЕНИЯ:

- **conditional-scoring дом** — `condition: {appliesToRounds[]}` на amrap/for_time/max_in_remaining/total/progressive (НЕ prescribed) — `composition.schema.ts:149-170`. «added now so the contract is frozen with the condition's home (phase 5 reads it; 10.2 only stores)» — `.feature-dev/1780426624/design.md:230-251`.
- **parallel-interleave дом** — `interleaveOrder: round_by_round | track_by_track` + `tracks[]{setEnumeration?, pairedWithRowId?}` — `composition.schema.ts:118-147`. round_by_round = раунд каждого трека, потом следующий; track_by_track = трек А целиком, потом Б.
- **tripwire to remove** — `scoring-inert-consumers.test.ts` (api-server) — это тот guard, который ph.5 **сознательно снимает** при старте.

**Ph.5 ≈** (a) снять inert-tripwire; (b) evaluator над `scoring` + `condition.appliesToRounds`; (c) interleave-executor над `arrangement.parallel.interleaveOrder`. Contract-change для чтения НЕ нужен; новые execution-результаты = row-payload / новая сущность (а это пересекается с DEFER-001 row-payload phase).

**⚠️ Предусловие:** перед execution нужен **authoring-вход для conditional-scoring** (C1, сейчас отсутствует) — иначе execution исполнять нечего, кроме seed-литералов. Логичный порядок ph.5: authoring-вход → execution.

---

## verify-note — поправка к одному agent-claim

verify-not-trust поймал over-claim seed-читателя: он заявил «until_recovery в сиде = ноль, только в contract-тесте». **НЕВЕРНО** — until_recovery реально засеян: `week-1-monday.ts:62` (`qualifier:"until_recovery"`) + `rest-coverage.ts:17` (`REST_BS_UNTIL_RECOVERY = restBetweenSets({value:3,unit:"min"}, "until_recovery")`). Причём с честным `value:3min`, не sham `:1` — что и подтверждает (d) «sham не enforced». Остальные 4 seed-gap claim того же читателя (stagedProgram/once/range/prescribed/for_time/INNER_LADDER_MARKER = ∅) — подтверждены self-greps.

---

## Источники

ADR-0037 · `algebra-spec.md` · `decisions.md` (D-PIVOT/INTERVAL/LADDER/CADENCE/EMOM-SLOT/EMOM-UX/CONTAINER-VS-ROW/LABEL/ALTGROUP-FOLD/UNTILREC/SCORING-INERT/10.4-2/10.4-S3-C/D/E/PHASE5-SCORING) · `deferred.md` · `phase-c-seed-conversion.md` · `journal.md` · `10-4-recon.md` · contract `composition.{schema,constants,label,types}.ts` + 6 contract-тестов · api-server `compose-projection.mapper.ts` + `schema/assertions.ts` + `scoring-inert-consumers.test.ts` + `authz/lms-guards.ts` · seed `canonical-schema.ts` + `builder/compose/` + `coverage-cells/` + `plan-synthetic/` · platform `compose/` (axes + lib + draft types) · `.feature-dev/` 12 runs (1780402567/426624/482955/511810/559503/577040/601689/637704 = 10.1/10.2/10.3/S1/S2-R1/S2-R2/S3-C/S3-D). Memory: [[compose-four-projection]].
