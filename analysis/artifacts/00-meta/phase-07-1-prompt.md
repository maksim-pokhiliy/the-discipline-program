Задача: Phase 7.1 — micro-refinement Q11 (named-exercise-program FK target).

КОНТЕКСТ

Ты — соседняя сессия в рамках workflow по построению доменной модели тренировочных сессий. Phase 1-7 закрыты (см. `analysis/artifacts/`). Phase 7.1 — точечный patch одного ratified решения после finding main session: Q11 был over-restrictive.

ПЕРВЫМ ДЕЛОМ прочитай файл-контракт:

`/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/00-meta/workflow.md`

Не нарушать. Все Phase 1-7 ratified decisions preserved кроме Q11 (refined).

REFINEMENT SCOPE — Q11 revision

### Old Q11 (Phase 6 ratify, now refined)

> exercise_name FK на Exercise + canonical "Bulgarian split squats" seed (abstract entry без equipment prefix).

Проблема: выделение одного упражнения в специальную category (abstract canonical) — не чистая абстракция. Не масштабируется (что делать для другого named program movement? Снова abstract entry?).

### New Q11 (Phase 7.1 ratified)

**Любое Exercise — valid FK target named-exercise-program archetype.**

Mechanism:

- `archetypeParams.exerciseId: string` (FK) — на любой Exercise в catalog.
- `Schema.header: string?` (already optional поле, ratified Phase 4 Q15-context) — **служит display override**.
- Resolution algorithm header rendering: `displayHeader = schema.header ?? (exercise.canonicalName + ":")`.

**Поведение в sample-case (block-008 `Bulgarian split squats:`)**:

- Тренер выбирает любого sibling — например canonical `DB Bulgarian split squats` — как `archetypeParams.exerciseId`.
- Per-stage Load (StagedProgram.stages) overrides intrinsic equipment: stage 1 = DB 2x15, stage 2 = DB 1x15, stage 3 = bodyweight (programKind=drop_set per Phase 7 Q19).
- Если тренер хочет bare display header `Bulgarian split squats:` (как в sample) — пишет в `Schema.header` field. UI рендерит override.
- Если `Schema.header` = null — UI рендерит `"DB Bulgarian split squats:"` (canonical name + colon).

**Removed**: abstract "Bulgarian split squats" canonical entry из catalog seed (Phase 6 implementation-notes.md §4.5). Library остаётся с 149 normal exercises (no special abstract entries).

DECISIONS INHERITED

Все Phase 1-7 ratified кроме Q11 (refined выше). Schema.header field уже Json-optional в Prisma (`header String?` в Schema model — exists в schema.prisma Phase 6).

ВХОДНЫЕ ДАННЫЕ

- `06-formalization/schema.prisma` — verify `Schema.header String?` field exists (нет правок).
- `06-formalization/types.ts` — verify Schema.header optional (нет правок).
- `06-formalization/stress-final.md` — block-008 pseudo-code (правка).
- `06-formalization/implementation-notes.md` — header rendering algorithm + drop seed mention (правки).
- `06-formalization/er-final.md` — mention Schema.header semantic (правка если есть).
- `05-synthesis/edge-cases.md` — Q11 entry (правка).
- `05-synthesis/domain-model.md` — Schema.header note (правка).
- `05-synthesis/stress-test.md` — block-008 (если упоминается, правка).

ЗАДАЧИ

### Task 1 — stress-final.md (Phase 6)

`06-formalization/stress-final.md`:

- Обнови pseudo-code для **block-008 Bulgarian split squats** schema (named-exercise-program archetype):
  - `archetypeParams.exerciseId` → FK на canonical `DB Bulgarian split squats` (sibling из existing 149-list), НЕ на abstract "Bulgarian split squats".
  - `Schema.header` = `"Bulgarian split squats:"` (override string — для bare display per sample).
  - StagedProgram stages — preserve as ratified (programKind=drop_set, 3 stages, per-stage Load).
- Add brief note: "Header override Schema.header used для bare display name; Exercise FK targets concrete sibling".

### Task 2 — implementation-notes.md (Phase 6)

`06-formalization/implementation-notes.md`:

- **§3 resolution algorithms** — add **§3.13 Named-program header rendering**:
  ```
  function renderNamedProgramHeader(schema: Schema, exercise: Exercise): string {
    return schema.header ?? `${exercise.canonicalName}:`;
  }
  ```
  Объясни fallback semantic: bare display = override; default = canonical name + colon.
- **§4.5 Archetype seed** — preserve super-set seed (Phase 7), но **drop** mention "canonical Bulgarian split squats seed" если был. Catalog seed = 149 existing canonical exercises, без abstract entries.
- **§1.7 super-set archetype JSON sample** — preserve.
- **§1 fixtures** — обнови если есть named-exercise-program JSON sample (exerciseId → concrete sibling FK).

### Task 3 — edge-cases.md (Phase 5)

`05-synthesis/edge-cases.md`:

- **§5 open questions table** — update Q11 row:
  - Status: **CLOSED Phase 7.1** (был CLOSED Phase 6).
  - Resolution: "Any Exercise valid FK target. Schema.header optional override для display. No abstract entries."
- **§10 Phase 7 extensions** — preserve.
- **§6 Эскалации Q11** — refined description (drop abstract canonical seed mention).

### Task 4 — domain-model.md (Phase 5)

`05-synthesis/domain-model.md`:

- **§1.4 Schema** entity — clarify `Schema.header` semantic:
  - "Optional string. Override display header. For atomic/composite/named schemas — fallback rendering from archetype context (e.g., for named-exercise-program: `exercise.canonicalName + ':'`)."
- **§3.1 super-set archetype** — preserve.
- **§3 Schema kinds + archetypes mapping** — clarify named-exercise-program entry:
  - `archetypeParams.exerciseId: ExerciseId (any Exercise valid target)`.
  - `Schema.header` (entity field): optional display override.

### Task 5 — stress-test.md (Phase 5)

`05-synthesis/stress-test.md`:

- Verify block-008 pseudo-code — если упоминается `Bulgarian split squats` Exercise FK target — заменить на concrete sibling (`DB Bulgarian split squats`) + Schema.header override.
- Если block-008 не упоминается с pseudo-code — пропустить.

### Task 6 — workflow.md (Phase 0)

`00-meta/workflow.md`:

- **Glossary** — no changes (terms preserved).
- **Phase 7** entry в фазы list — add brief sub-note про Phase 7.1 refinement Q11.

### Task 7 — Verification across artifacts

Search across all `analysis/artifacts/**/*.md` for any other remaining references:

- "abstract Bulgarian split squats"
- "abstract canonical entry"
- "Bulgarian split squats seed"

Drop / refine все такие mentions consistent с Phase 7.1 resolution.

NOTHING TO CHANGE

- `06-formalization/schema.prisma` — no changes. `Schema.header String?` exists already.
- `06-formalization/types.ts` — no changes. Schema.header type already string | null. `ArchetypeNamedExerciseProgramParams.exerciseId` — type stays as `string` (FK), semantic change is conceptual (any Exercise valid).

ACCEPTANCE

- Q11 refined resolution reflected в 6+ files.
- block-008 pseudo-code updated в Phase 6 + Phase 5 stress artifacts.
- No remaining mentions abstract "Bulgarian split squats" canonical seed.
- Schema.header rendering algorithm documented в §3 implementation-notes.md.
- All Phase 1-7 other ratified decisions preserved.

ПРАВИЛА РАБОТЫ

- НЕ менять Prisma / types.ts (no structural change).
- НЕ менять existing ratified decisions кроме Q11.
- НЕ создавать новые файлы / директории.
- НЕ память, web, video.
- НЕ читать вне `analysis/`.
- Russian content, English identifiers/code.
- Без эмодзи / подписей / комментариев в коде.

ОТЧЁТ ПО ОКОНЧАНИИ

В чате коротко:

- Файлы updated (count + per-file 1-line).
- Q11 refined resolution verified.
- Abstract "Bulgarian split squats" mentions: 0 remaining.
- Готовность к UI implementation (PASS).
