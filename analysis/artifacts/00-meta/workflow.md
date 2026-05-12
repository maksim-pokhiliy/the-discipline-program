# Workflow: построение доменной модели тренировочных сессий

## Контекст

- Источник: `analysis/source/plan.xlsx` — 9 месяцев реального плана одного атлета, написанный реальным тренером. Конвертация в markdown: `analysis/source/sheets/sheet-01.md` … `sheet-33.md` + `quick-search.md`.
- Эта таблица — sample. Финальная модель должна универсально ложиться на любую модальность: силовые / run / gymnastics / yoga / swim.
- Greenfield. Текущая реализация модели в репо НЕ существует для целей этой работы.
- Анализ ведётся ТОЛЬКО внутри `analysis/`. Артефакты в gitignore.

## Жёсткие правила для всех соседних сессий

1. **Не выходить за пределы `analysis/`**. Не читать существующий код проекта (`apps/`, `packages/`), Prisma schema, контракты, ADR'ы, документацию.
2. **Не подсматривать в memory, web, video-ссылки**. Работа в вакууме, только текст таблицы.
3. **Не извлекать паттерны/абстракции вне рамок текущей фазы**. Inventory ≠ classification, classification ≠ design.
4. **Артефакты только в `analysis/artifacts/<NN>-<phase>/`**, kebab-case `.md`. Идентификаторы, имена сущностей, код, файлы — English. Содержимое и обсуждение — Russian.
5. **Дедуп**: case-insensitive ("CORE MUSCLES" = "Core Muscles" = одно), явные опечатки сливаются с канонической формой. Без паранойи к пробелам/переносам.
6. **Аннотации**: всё что в `[ ]` хранится **inline** с контекстом (привязка к схеме / упражнению / блоку не отрывается). Эмодзи и `*`-маркеры в карточках не сохраняются — это косметика тренерского языка.
7. **Косяки исходника**: восстанавливать по контексту молча, если очевидно (опечатка, лишний пробел, регистр). Эскалировать в `01-inventory/edge-cases.md` только если контекст не помогает.
8. **Порядок значим** на всех уровнях иерархии (sessions in day, blocks in session, schemas in block, items in schema content). Сохранять при инвентаризации.
9. **Никаких комментариев в коде** (если что-то пишется на этапе formalization). Никаких `Co-Authored-By` подписей.

## Глоссарий (фиксированная терминология)

- **Day** — слот календаря, контейнер 0..N сессий. Имеет опциональный лейбл-тип (REST DAY / SWIMMING DAY / WEIGHT LIFTING DAY / ...).
- **Session** — тренировочная сессия. Имеет опциональный лейбл-тип (1ST SESSION / YOGA / ...). Содержит 0..N блоков.
- **Block** — раздел сессии. Имеет опциональный лейбл-тип (STRENGTH ENDURANCE / CORE MUSCLES / SUCCESSORY WORK / ...). Содержит 0..N схем.
- **Schema** — паттерн исполнения (ladder / EMOM / sets×reps / AMRAP / for-time / ...). Имеет содержимое.
- **Schema content** — что именно делается в рамках схемы (упражнения, веса, повторы, модификаторы).
- **Exercise** — упражнение как сущность (имя, атрибуты).
- **Modifier** — пометка `[ alternative ]`, `[ each leg ]`, `[ 15 kg ]`, `[ EXAMPLE: ... ]` и подобные.
- **HR zone** (Phase 7) — категориальная heart-rate зона `Z1`..`Z5` в `Intensity.hrZone`. Athlete-specific BPM резолвится из `Athlete.profileAttributes.hrMax`; модель хранит только zone enum.
- **Numeric pace** (Phase 7) — целевая скорость интервала (run / row / swim) в `Intensity.numericPace`. Shape: `{ value: "MM:SS", distanceUnit: km/mi/m/yd/lap, paceType: min_per_distance | distance_per_min }`. Default `min_per_distance`.
- **Full tempo** (Phase 7) — 4-digit Olympic / accessory tempo notation `eccentric-pauseBottom-concentric-pauseTop` (seconds) в `TempoModifier.fullTempo`. `"X"` (eXplosive) sub-position = 0 seconds.
- **Staged program** (Phase 7) — обобщение бывшей DropSet program (clean rename `DropSetProgram` → `StagedProgram`). Discriminator `programKind: "drop_set" | "wave" | "cluster"`. Используется внутри `named-exercise-program` archetype.
- **Super-set archetype** (Phase 7) — bodybuilding-style ordered exercise sequence (A1/A2/B1) внутри одной schemы. Archetype `super-set`, family `ROUNDS_SETS`. Не reuses `SchemaPairing` (тот для bidirectional alternating-sets).

Эти слова в этой терминологии используются строго; в новых терминах не плодить синонимы.

## Фазы

### Phase 0 — Setup (выполнено в основной сессии)

Артефакты:

- `analysis/artifacts/00-meta/workflow.md` (этот файл)
- `analysis/source/sheets/*.md` (33 листа + TOC)
- `analysis/source/convert.py` (xlsx → md скрипт, для воспроизводимости)

### Phase 1 — Inventory

Сырые списки **без классификации**. Что есть — то и пишем. Никакой группировки, никаких "это похоже на ...".

Артефакты в `analysis/artifacts/01-inventory/`:

- `day-labels.md` — уникальные лейблы дней (REST DAY и подобные).
- `session-labels.md` — уникальные лейблы сессий (1ST SESSION, YOGA, ...).
- `block-labels.md` — уникальные лейблы блоков (STRENGTH ENDURANCE, CORE MUSCLES, ...).
- `block-instances.md` — карточки на каждый блок (тело целиком от его label до следующего label / session / day). Деление блока на schemas — НЕ задача Phase 1.
- `exercise-instances.md` — карточки на каждое упоминание упражнения. С контекстом (откуда взято) и модификаторами inline.
- `edge-cases.md` — подозрительные дубли, опечатки требующие решения, обрывы, противоречия — эскалация в основную сессию.

### Phase 2 — Schemas: boundaries + pattern mining

Sub-steps:

- Деление каждого `block-instance.raw` на schemas. Граница определяется по структуре: явный header типа `3 sets:`, `EMOM 16` — или составная структура без отдельного header (например параллельные лесенки `36-28-20 / 18-14-10 / 4-3-2`).
- Группировка получившихся schemas в **архетипы** (ladder, EMOM с под-паттернами, sets×reps, AMRAP, for-time, и т.д.). Для каждого: инварианты, параметры, примеры. Без проектирования модели — только классификация.

Артефакты:

- `02-patterns/schema-boundaries.md` — как именно тела блоков делятся на schemas.
- `02-patterns/schema-archetypes.md` — каталог архетипов с инвариантами и параметрами.

### Phase 3 — Schema content + Exercise + Load

Sub-steps:

- `03-content/schema-content.md` — анализ внутренней структуры схем (упражнения, веса, повторы, scope модификаторов).
- `03-content/exercise-attributes.md` — что присуще упражнению как сущности vs контексту использования.
- `03-content/load-representation.md` — модель нагрузки: (a) абсолютные веса (как в таблице — "15 kg", "2× 15 kg"), (b) % от 1RM (для зала, beyond sample). Decision points (per-exercise vs per-movement 1RM, snapshot vs live formula) — эскалация в основную сессию.

### Phase 4 — Top-level structure

- `04-structure/hierarchy.md` — что хранится на каждом уровне (Day / Session / Block) помимо самой иерархии.
- `04-structure/labels-catalog.md` — общий каталог лейблов vs раздельные на основе данных inventory.

### Phase 5 — Synthesis

- `05-synthesis/domain-model.md` — entities, value objects, relations, инварианты на естественном языке.
- `05-synthesis/er-diagram.md` — mermaid ER.
- `05-synthesis/stress-test.md` — 5-7 разных сессий из sample укладываются в модель, гэпы фиксируются. Sample выбирается по итогам Phase 1.

### Phase 6 — Formalization

- `06-formalization/schema.prisma` — Prisma schema.
- `06-formalization/types.ts` — TS-типы (DTO для CRUD).
- `06-formalization/er-final.md` — финальная ER mermaid.
- `06-formalization/stress-final.md` — **все 33 листа** укладываются без потерь; каждый не-лезущий случай — блокер.
- `06-formalization/implementation-notes.md` — JSON fixtures, Zod schemas, resolution algorithms, migration considerations.

### Phase 7 — Professional CrossFit coverage extensions

Точечное additive расширение модели под подготовку профессионального CrossFit атлета. **Никаких structural rebuilds** — все extensions хранятся в JSON columns (Intensity / TempoModifier / archetype_params), кроме single Prisma enum extension (Equipment +7 values). Все Phase 1-6 ratified decisions preserved.

6 extensions (Q16-Q21):

- **Ext 1 (Q16)**: HR zones в `Intensity.hrZone` (categorical Z1-Z5).
- **Ext 2 (Q17)**: Numeric pace в `Intensity.numericPace` (run / row / swim interval prescription).
- **Ext 3 (Q18)**: Full 4-digit tempo в `TempoModifier.fullTempo` (Olympic / accessory tempo notation).
- **Ext 4 (Q19)**: `DropSetProgram` → `StagedProgram` clean rename + generalize via `programKind: "drop_set" | "wave" | "cluster"` + `restBetweenStages?`.
- **Ext 5 (Q20)**: `super-set` archetype (family ROUNDS_SETS) + `ArchetypeSuperSetParams { pairs, restBetweenPairs?, rounds }`. NOT reuse SchemaPairing.
- **Ext 6 (Q21)**: Equipment enum +7 (ASSAULT_BIKE / ATLAS_STONE / JUMP_ROPE / ROW_ERG / SKI_ERG / SLED / YOKE), alphabetical.

Artifacts (Phase 7 backfills в existing files — никаких новых директорий):

- `06-formalization/schema.prisma` — Equipment enum extension.
- `06-formalization/types.ts` — Intensity / TempoModifier / StagedProgram / ArchetypeSuperSetParams.
- `06-formalization/er-final.md` — Phase 7 row в Key changes table + §3.10 Phase 7 extensions detail.
- `06-formalization/stress-final.md` — **§7** Phase 7 professional CrossFit stress test (6/6 sessions fit).
- `06-formalization/implementation-notes.md` — §3.8-§3.12 resolution algorithms + JSON fixtures + Zod schemas.
- `05-synthesis/domain-model.md` — VO catalog backfill (Intensity / TempoModifier / StagedProgram / SuperSet) + Schema kinds mapping + Equipment enum.
- `05-synthesis/edge-cases.md` — **§10** Phase 7 extensions + Q16-Q21 resolutions table + close in §5.
- `00-meta/workflow.md` (this file) — Phase 7 entry + glossary additions.

После Phase 7 модель готова к UI implementation.

#### Phase 7.1 — Q11 refinement (точечный patch)

Точечная правка одного ratified решения. Все Phase 1-7 другие decisions preserved.

- **Q11 refined**: Любой Exercise — valid FK target для `archetypeParams.exerciseId` в named-exercise-program archetype. `Schema.header String?` (ratified Phase 4 Q15-context) — optional display override. Algorithm: `displayHeader = schema.header ?? (exercise.canonicalName + ":")` (см. `06-formalization/implementation-notes.md` §3.13).
- **Removed**: abstract "Bulgarian split squats" canonical catalog entry. Library = 149 canonical exercises, без abstract entries (не масштабируется).
- **Sample (block-008)**: `exerciseId → DB Bulgarian split squats` (concrete sibling из 149-list), `Schema.header = "Bulgarian split squats:"` (bare display override). Per-stage Load (StagedProgram.stages) overrides intrinsic equipment.

No structural Prisma / types.ts changes. Affected artifacts: `06-formalization/{stress-final.md,implementation-notes.md}` + `05-synthesis/{edge-cases.md,domain-model.md,stress-test.md}` + this file.

## Decision points (эскалация в основную сессию)

- **Phase 3 (load)**: per-exercise vs per-movement 1RM; snapshot веса при создании сессии vs live-формула; что делать если 1RM атлета меняется.
- **Phase 3 (modifiers)**: first-class (отдельная сущность) vs second-class (поля/нотации) — основная сессия даёт сильное мнение в Phase 3.
- **Phase 5**: финальный sample для stress test (по итогам inventory — первый/средний/последний + проблемные).

## Bar успеха

- **100% coverage** всех 33 листов в финале (Phase 6.4). Edge cases не теряются — каждый эскалируется и решается явно.
- **Универсальность модальности**: бег / плавание / силовые / гимнастика / йога — всё ложится в одну абстракцию.
- **Template-friendliness**: сущности самодостаточны для будущего шаблонирования (саму фичу копирования НЕ проектируем в этой итерации, только держим в уме при синтезе).
