# Step 2 — Output

## Что сделано

Прокинули training-domain срез из `analysis/artifacts/06-formalization/schema.prisma` в реальный `packages/api-server/prisma/schema.prisma`: 11 новых enums + 14 новых моделей (Week/Day/Session/Block/BlockLabelAssignment/Schema/SchemaPairing/SchemaRow/Exercise/Label/Archetype/OneRMRecord/PerformedSession/PerformedExerciseInstance) + 3 back-relации на существующие `User` и `TrainingPlan`. Засеяли все 34 канонических архетипа (33 Phase 1-6 + super-set Phase 7) в `training_archetypes`. `Exercise` и `Label` оставлены пустыми (libraries per D4). DB reset + seed прошли без ошибок; полный набор тестов / type-check / lint — зелёный.

## Изменённые/созданные файлы

- `packages/api-server/prisma/schema.prisma` (+400 LOC; training-domain delimited section в конце файла; 3 строки на back-relации в существующих `User` и `TrainingPlan`)
- `packages/api-server/prisma/seed/archetypes/index.ts` (NEW; entry-point с `seedArchetypes`)
- `packages/api-server/prisma/seed/archetypes/rounds-ladder.ts` (NEW; 10 архетипов: 3 ROUNDS_SETS + 7 LADDER)
- `packages/api-server/prisma/seed/archetypes/time-composite.ts` (NEW; 10 архетипов: 4 TIME_CAP + 6 COMPOSITE_ROUNDS)
- `packages/api-server/prisma/seed/archetypes/nested-named.ts` (NEW; 5 архетипов: 3 NESTED + 2 NAMED)
- `packages/api-server/prisma/seed/archetypes/headerless-modality.ts` (NEW; 9 архетипов: 3 SINGLE_LINE_HEADERLESS + 2 FLAT_PARALLEL_HEADERLESS + 4 MODALITY_REFERENCE)
- `packages/api-server/prisma/seed.ts` (+2 LOC; import + call seedArchetypes между clearAll и passwordHash)
- `packages/api-server/prisma/seed/clear-all.ts` (+1 LOC; `db.archetype.deleteMany()` после `user.deleteMany`)
- `implementation/step-02/output.md` (NEW; этот отчёт)

Никаких изменений вне `packages/api-server/prisma/` и `implementation/step-02/`.

## Принятые решения

- **Источник `archetypeParamsSchema`** — `analysis/artifacts/06-formalization/types.ts` `ArchetypeParams` discriminated union. `implementation-notes.md` §1.7 даёт JSON-shape только для 9 архетипов, а §4.5 — полный seed-template только для 2-х (parallel-ladders-descending, super-set). Однако `types.ts` имеет per-archetype `Archetype*Params` interface для ВСЕХ 34 archetypes (24 с named params + 6 c `Record<string, never>`) — это canonical Phase 6/7 источник, ratified в Step 1. Каждая запись `archetypeParamsSchema` — минимальный JSON Schema (Draft-7 subset: `required` + `properties` + `type` + базовые constraints) с структурой, точно соответствующей TS interface. Это derivation, не fabrication; не сработал escalation trigger #1.
- **Имена + family + kind** — verbatim из `types.ts` `ArchetypeName` union и `analysis/artifacts/02-patterns/schema-archetypes.md` (Phase 2.2 catalog, описывает kind / header / body / parameters / related связи для всех 33; super-set покрыт §4.5 implementation-notes).
- **Семантика `relatedArchetypes`** — нормализована на underscore-style (`paired_with`, `specialization_of`, `extension_of`, `continuation_of`, `contains`, `contained_by`) — соответствует §4.5 template. schema-archetypes.md местами использует hyphen-style, но §4.5 — единственный конкретный seed-template, на него и опирался. Self-referential паттерны (`paired-with: alternating-sets` для самих alternating-sets — описание «всегда appears в парах», не self-loop) и описательные без targets (`specialization-of: общая ladder-семья`) — пропущены.
- **Split seed на 4 файла** — manifesto-bar / ESLint `max-lines: 300` запретили монолит на 706 LOC. Применил pattern из существующего `seed/marketing-pages/` (директория с per-section файлами): `seed/archetypes/index.ts` + 4 per-family data файла (132/128/232/225 LOC). 9 ArchetypeFamily сгруппированы в 4 файла так, чтобы каждый ≤ 300 LOC. Импорт `seed.ts` (`from "./seed/archetypes"`) резолвится в `index.ts` через Node module resolution; рефакторинг seed.ts не потребовался.
- **`OneRMRecord.valueKg`** — `Decimal @db.Decimal(6, 2)` per Step-02 micro-Q2. Existing precedent: `AthleteProfile.weightKg Decimal? @db.Decimal(5, 2)`.
- **`@@map` для каждой training-domain модели** — `training_*` snake*case prefix, ratified в prompt. Зеркалит существующие префиксы (`app*\_`, `lms\_\_`, `marketing\_\*`, `users`).
- **Section delimiter в schema.prisma** — оставил три комментария-строки `// === Training-domain ... // Source spec: ... // Ratified per D1-D4 ...` per prompt allowance (`§6: schema-DSL section markers welcome`). Это единственные комментарии внутри файлов — ни в seed-файлах, ни в `seed/clear-all.ts` комментариев нет.
- **clearAll расширение** — добавил `db.archetype.deleteMany()` в конец, чтобы повторный `pnpm db:seed` (без `db:reset`) был idempotent. Существующие deletes (`trainingPlan` cascades → Week→Day→Session→Block→Schema→SchemaRow→SchemaPairing→BlockLabelAssignment; `user` cascades → OneRMRecord→PerformedSession→PerformedExerciseInstance) гарантируют, что к моменту `archetype.deleteMany()` нет Restrict-references от Schema. Exercise / Label deleteMany не добавлял — не сеется, не должно копиться.
- **`prisma format` whitespace** — formatter переставил поля и indentation в нескольких новых моделях; принял output как есть. Schema validates clean.
- **Не трогал `analysis/**`, `apps/**`, `packages/\*`вне`api-server`, lock-файлы, CI**.
- **`db:reset` ≠ автосеед** в этом репо — script на `prisma db push --force-reset && tsx scripts/apply-sql-checks.ts`, без seed; пришлось дополнительно вызвать `pnpm --filter @repo/api-server db:seed`. Prompt §6.2 описывает reset как «drops + creates DB + applies schema + runs full seed», но script определён иначе — следовал реальному поведению.

## Возникшие вопросы и как решены

- **«Source spec impl-notes.md`§4.5` шапка прописывает upsert; вы используете createMany — расхождение»**. Решение: prompt §`Hypothesis bank` явно разрешает `createMany` (`use createMany for archetype seed; faster and atomic`). `clearAll` + `createMany` идемпотентны при работе через `db:reset` или повторный `db:seed`.
- **«ArchetypeParamsSchema schema-archetypes.md описательно — derive из types.ts достаточно?»**. Да: types.ts ratified Step 1 (один из inputs, явно перечислен в prompt §`Inputs to read`). `types.ts.ArchetypeParams` — единственная exhaustive enumeration; покрывает все 34. Derivation от TS-interface к JSON Schema — не fabrication, а транскрипция в другой формат.

## Что отложено

- **Exercise / Label seed** — out of scope per D4 (libraries; coach создаёт через admin UI). Step 3 (Admin Exercise CRUD) и Step 4 (Admin Label CRUD) их реализуют.
- **Week / Day / Session / Block / Schema / SchemaRow содержимое seed** — out of scope per D3 (full-scope port, не full-scope seed). Athlete-flow UI вне scope первой волны.
- **citext миграция для `Exercise.canonicalNameLower` / `Label.nameLower`** — оставил как есть per prompt §`Additional ratifications` («do NOT silently swap to citext»). Lowercase variant maintained в app-layer.
- **OneRMRecord / PerformedSession / PerformedExerciseInstance seed** — out of scope; athlete-flow stays out of UI scope. Schema порту достаточно, чтобы Step 3+ не требовали второй волны schema-changes.
- **Versioned migrations directory** — не создаётся per ADR-0019 (discipline-program dev Neon, `db:reset` per schema change).

## Ссылка на `.feature-dev/<ts>/`

`/home/maksym/projects/contrib/the-discipline-program/.feature-dev/1778644165/` — содержит `research.md` (S-Stage 1) и `review.md` (S-Stage 3).

## Сценарий смоук-теста

N/A — Step 2 не затрагивает UI. Smoke-test для Step 2 = успешный `db:reset` + `db:seed` + ручная проверка populations (см. `Verification notes` ниже).

## Verification notes

- `pnpm --filter @repo/api-server exec prisma format`: ✓ `Formatted prisma/schema.prisma in 116ms`.
- `pnpm --filter @repo/api-server exec prisma validate`: ✓ `The schema at prisma/schema.prisma is valid`.
- `pnpm --filter @repo/api-server exec prisma generate`: ✓ `Generated Prisma Client (v6.1.0)`.
- `pnpm --filter @repo/api-server db:reset`: ✓ `Your database is now in sync with your Prisma schema. Done in 10.54s`; `apply-sql-checks` applied 3 constraints.
- `pnpm --filter @repo/api-server db:seed`: ✓ `Seed completed!`. Seeders в порядке: Archetypes(34), Users(13), Profiles(11), assignments(10), notes(10), training plans(4), pages(6 + 21 sections), products(4), blog(8), reviews(10), contacts(10).
- `pnpm check-types`: ✓ `Tasks: 16 successful, 16 total` (все workspace).
- `pnpm lint`: ✓ `Tasks: 16 successful, 16 total` (eslint --max-warnings 0).
- `pnpm test`: ✓ `Test Files 89 passed (89) | Tests 728 passed (728) | Duration 236.31s`.
- Table populations post-reset:
  - `training_archetypes`: **34** (3 ROUNDS_SETS / 7 LADDER / 4 TIME_CAP / 6 COMPOSITE_ROUNDS / 3 NESTED / 2 NAMED / 3 SINGLE_LINE_HEADERLESS / 2 FLAT_PARALLEL_HEADERLESS / 4 MODALITY_REFERENCE = 34; 9 ATOMIC / 12 HEADERLESS / 5 NESTED / 6 COMPOSITE / 2 NAMED = 34).
  - `training_exercises`: 0 ✓ (library, D4).
  - `training_labels`: 0 ✓ (library, D4).
  - `training_weeks` / `training_days` / `training_sessions` / `training_blocks` / `training_one_rm_records` / `training_performed_sessions` (и остальные training\_\*): 0 ✓.
  - `users`: 13 (1 admin + 1 coach + 1 head coach + 10 athletes) ✓.
  - `lms_training_plans`: 4 ✓.

## Acceptance criteria self-check

- [x] schema.prisma extended with training-domain section (14 models + 11 enums + 3 back-relation edits on existing User/TrainingPlan).
- [x] All `@@map("training_*")` per spec.
- [x] OneRMRecord.valueKg has `@db.Decimal(6, 2)`.
- [x] No stub User / stub TrainingPlan ported (use existing).
- [x] No Athlete model.
- [x] OneRMRecord.userId, PerformedSession.userId.
- [x] seed/archetypes/\* created with exactly 34 entries (3 + 7 + 4 + 6 + 3 + 2 + 3 + 2 + 4 = 34).
- [x] seed.ts updated to call seedArchetypes.
- [x] No Exercise / Label seed.
- [x] prisma format/validate/generate succeed.
- [x] db:reset succeeds (plus follow-up db:seed).
- [x] Type-check / lint / tests green.
- [x] No changes outside packages/api-server/prisma/ and implementation/step-02/.
