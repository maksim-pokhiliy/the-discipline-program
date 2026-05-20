# Step 8.1c — output report

`SchemaPairing` → `AlternatingGroup` model redesign (Prisma + contract + analysis + seed). Executor session, `/feature` full pipeline. Branch `feat/training-domain`, base `a94bebb6`.

## Что сделано

Ratified decision **D14** реализован: 2-FK pair-таблица `SchemaPairing` заменена на `AlternatingGroup` — block-scoped N-ary grouping entity (2..N member schemas, без потолка). Membership — single nullable FK `Schema.alternatingGroupId`. Изменения прокатаны по 4 слоям: Prisma schema, `@repo/contracts` slice, `analysis/` living source, seed descriptor. Слой определения модели — **ни одного эндпоинта, mapper'а или guard'а** (это Step 8.1d).

5 коммитов: 3 per-layer atomic (Phase 1/2/3) + 1 ratified WORKFLOW-001 fix + этот output report.

| #   | SHA        | Commit                                                                          |
| --- | ---------- | ------------------------------------------------------------------------------- |
| 1   | `aec22f8a` | `refactor(api-server): replace schemapairing model with alternatinggroup`       |
| 2   | `ae8b8cd6` | `refactor(contracts): replace schema-pairing slice with alternating-group`      |
| 3   | `76bb334c` | `docs(analysis): sync artifacts for alternatinggroup redesign`                  |
| 4   | `8c3a701b` | `fix(api-server): clear pre-existing head-coach in schema and label test setup` |
| 5   | —          | `docs(step-08.1c): write executor output report` (этот файл)                    |

## Изменённые/созданные файлы

**Commit 1 — Phase 1 (api-server), 4 файла:**

- `packages/api-server/prisma/schema.prisma` — drop `enum SchemaPairingRelation` + `model SchemaPairing`; add `enum AlternatingGroupRelation` + `model AlternatingGroup`; edit `Schema` (drop `pairingsA`/`pairingsB`, add `alternatingGroupId String?` + relation `onDelete: SetNull` + `@@index`); edit `Block` (add `alternatingGroups`).
- `packages/api-server/prisma/seed/archetypes/rounds-ladder.ts` — drop `pairedWithSchemaId` из `alternating-sets` descriptor.
- `packages/api-server/src/endpoints/lms/schema/admin.test.ts` — drop 2 teardown sites + shed cascade-test `SchemaPairing` limb + retitle `it()`.
- `packages/api-server/src/endpoints/lms/schema-row/admin.test.ts` — drop 2 teardown sites.

**Commit 2 — Phase 2 (contracts), 20 файлов:**

- CREATE `packages/contracts/src/entities/lms/alternating-group/` — 8 файлов (`index.ts`, `*.constants.ts`, `*.schema.ts`, `*.types.ts`, `*-api.schema.ts`, `*-api.types.ts`, `*.schema.test.ts`, `*-api.schema.test.ts`).
- DELETE `packages/contracts/src/entities/lms/schema-pairing/` — 8 файлов.
- MODIFY `packages/contracts/src/entities/lms/schema/archetype-params.schema.ts` (drop `pairedWithSchemaId`), `.../schema/schema.schema.test.ts` (drop stale fixture key), `.../lms/index.ts` (barrel), `packages/contracts/package.json` (exports map).

**Commit 3 — Phase 3 (analysis), 8 файлов:** см. `analysis-files touched` ниже.

**Commit 4 — WORKFLOW-001 fix (api-server), 2 файла:**

- `packages/api-server/src/endpoints/lms/schema/admin.test.ts` — `beforeAll` демоутит pre-existing `HEAD_COACH` → `COACH` перед промоушеном фикстуры.
- `packages/api-server/src/endpoints/lms/label/platform.test.ts` — то же внутри `it("authorizes a HEAD_COACH caller")`.

**Commit 5:** `implementation/step-08.1c/output.md`.

`analysis-files touched:` `analysis/artifacts/06-formalization/schema.prisma`, `06-formalization/types.ts`, `06-formalization/er-final.md`, `06-formalization/implementation-notes.md`, `06-formalization/stress-final.md`, `05-synthesis/domain-model.md`, `05-synthesis/edge-cases.md`, `05-synthesis/stress-test.md` (8 файлов). `analysis/artifacts/00-meta/**` — не тронут (frozen, 9 `SchemaPairing`-упоминаний остаются как point-in-time history).

## Принятые решения

- **Промпт § 3 исполнен verbatim.** D14 / D-A1 / D-A2 / D-A3 / C-A1 применены как ратифицированы. Никакого scope-drift в 8.1d (api/mapper/guard/behavioural tests — отсутствуют, проверено grep'ом).
- **Teardown tactical call (§ 3.1 op 4):** все 4 `cleanupRaw.schemaPairing` teardown-сайта в 2 api-server тестах **удалены** (не мигрированы) — `AlternatingGroup.block onDelete: Cascade` покрывает их при удалении Block, которое окружающий teardown уже делает. Промпт явно разрешил («prefer dropping if it leaves teardown simpler»).
- **Cascade test** (`schema/admin.test.ts`): `SchemaPairing`-конечность отрезана (создание pairing + `pairingAfter` fetch + assertion удалены); остальные assertions (`parentAfter`/`subAfter`/`rowAfter`/`siblingAfter`) сохранены; `it()` переименован.
- **`createAlternatingGroupSchema`**: `.refine` на дубликаты — на массиве `schemaIds` (mirror `reorderSchemaRowsSchema`), `blockId` отсутствует (сервер выведет из member schemas в 8.1d), entity-schema `schemaIds` — `.min(2)` без refine (per § 3.2).
- **`implementation-notes.md` scope** — § 3.3 предписывал «addendum only», но в файле нашлись 3 pre-existing `SchemaPairing`-упоминания. **Ратифицировано пользователем 2026-05-20:** строки ~1163 + ~1363 синхронизированы на `AlternatingGroup`; строка ~37 (§0.3 D3-трейл — историческая запись) оставлена; добавлен §4.9 D14 addendum.
- **WORKFLOW-001 (HEAD_COACH-коллизия)** — **ратифицировано пользователем:** починено inline (commit 4), а не отложено на Step 8.3.7-pre. См. «Возникшие вопросы».
- Anchor `06-formalization/schema.prisma` зеркалит реальный Prisma minus `@@map` (anchor convention).

## Возникшие вопросы и как решены

1. **`implementation-notes.md` — gap в § 3.3.** Спека предписывала только addendum, но файл содержал stale current-state-прозу про `SchemaPairing`. Escalation → пользователь ратифицировал: sync 1163+1363, leave 37. (`design.md` § 9.)

2. **WORKFLOW-001 / acceptance #17.** Полный `pnpm test` (run 1) дал 2 фейла — `schema/admin.test.ts` (33 skipped) и `label/platform.test.ts` (1 failed), оба `P2002` на `(role)`: seed создаёт 1 `HEAD_COACH`, partial unique index `idx_single_head_coach` (D13) разрешает одного, эти 2 файла создавали второго без предварительной очистки. QA воспроизвёл это на base `a94bebb6` → **pre-existing, не от 8.1c**. Escalation → пользователь выбрал inline-fix. Commit 4: оба файла теперь демоутят pre-existing `HEAD_COACH` → `COACH` перед созданием фикстуры — точный mirror паттерна из `authz/guards.test.ts`, `lms/plan-enrollment/admin.test.ts`, `iam/users-admin-actor-role.test.ts` (3 sibling-файла, которые уже так делают и были зелёными). Остальные 3 HEAD_COACH-файла не тронуты — они уже несут паттерн.

3. **Phase 3 grep-heuristic vs D14-addendum.** Verification-grep в Phase-3-промпте требовал «выживает только строка 37». Но § 3.3 сам предписывает добавить D14-addendum, который по определению называет superseded-сущность `SchemaPairing`. Resolved: mandate addendum'а governs; выжившие `SchemaPairing`-упоминания (§4.9 addendum + 3 supersession-history фразы в `domain-model.md` / `edge-cases.md` / `stress-test.md`) — легитимный decision-trail, не stale live-references. Stale live-references вычищены (er-final.md §3.1 entity-bullet, edge-cases.md Q20).

4. **(minor, для прозрачности)** `git log` по `seed/users.ts` / `lms-checks.sql` показал коммиты из истории репо до training-domain workflow (`m2.0`, `wave-b`, `chore: strip plan-detail, library and workout-log stack entirely`). Оценено как нормальная история `main` + задокументированное удаление прошлых попыток; текущие файлы чистые; vocab не из WORKFLOW.md watch-list. Не блокер; флагнуто пользователю.

## Что отложено

- **Step 8.1d:** `lmsAlternatingGroupApi` (`create`/`addMember`/`removeMember`/`delete`), `verifyAlternatingGroupOwnership` guard, `mapToAlternatingGroup` mapper, `addMember`/`removeMember` contract-схемы, group lifecycle (same-block invariant, dissolve-on-shrink-below-2, archetype homogeneity, setEnumeration tiling).
- **D-A2:** contract `Schema.alternatingGroupId` exposure + `mapToSchema` — будущий read-embed шаг.
- **Steps 8.2 / 8.3 / 8.4 / D11:** HTTP routes / client hooks / UI.
- **Step 8.3.7-pre (WORKFLOW-001):** 8.1c починил 2 коллизящих файла inline; остальные 4 HEAD_COACH-файла уже несли паттерн. Запланированный systematize-фикс (`db:reset:for-tests` alias / convention doc) — на усмотрение планировщика: его можно сузить или закрыть, так как deterministic collision больше не воспроизводится (`pnpm test` зелёный на `db:reset`+`db:seed` DB).

## Ссылка на `.feature-dev/<ts>/`

`.feature-dev/1779259966/` — `research.md` (§0 verification, 0 content drift), `design.md` (RFC), `plan.md`, `tasks.md` (resume tracker), `review.md` (Stage 5, score A), `qa.md` (Stage 6, score A + QA-001).

## Verification notes

- `pnpm check-types` (root) — **16/16** ✓
- `pnpm lint` (root) — **16/16, 0 warnings** ✓
- `pnpm test` (root) — **131 файла / 1610 тестов, все pass** ✓ (run 2, после WORKFLOW-001 fix, на `db:reset`+`db:seed` DB). Run 1 (до fix) имел 2 WORKFLOW-001 фейла.
- `pnpm dep:check` — **0 violations** (1261 modules) ✓
- `git grep -nE "SchemaPairing|schemaPairing|schema-pairing|SCHEMA_PAIRING|pairedWithSchemaId" -- packages/` — **0 hits** ✓ (acceptance #13)
- `schema/admin.test.ts` дополнительно проверен изолированно на HEAD_COACH-clear DB **до** WORKFLOW-001-фикса — 33/33 pass — подтверждает, что миграция 8.1c этого файла корректна сама по себе.
- `db:reset` + `db:seed` — успешны; seed reports `Archetypes: 34`; `apply-sql-checks` — 3 constraints, без `training_schema_pairings`/`training_alternating_groups` коллизии.
- Husky pre-commit зелёный на всех 5 коммитах; `--no-verify` / `--no-edit` / `--no-gpg-sign` не использовались. pre-push отрабатывает при push.
- Pre-existing flake FIND-002 (`block/admin.test.ts:406`) — не сработал в обоих прогонах.
- **UI smoke-test scenario — N/A** (слой определения модели, runtime-поверхности нет).

## Acceptance criteria self-check

| #   | Критерий                                                                                                                       | Статус                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `enum SchemaPairingRelation` + `model SchemaPairing` удалены                                                                   | ✅                                                                                                                                                                                                    |
| 2   | `enum AlternatingGroupRelation` + `model AlternatingGroup` (fields/`onDelete: Cascade`/`schemas`/`@@index([blockId])`/`@@map`) | ✅                                                                                                                                                                                                    |
| 3   | `Schema`: `pairingsA`/`pairingsB` удалены; `alternatingGroupId String?` + relation `onDelete: SetNull` + `@@index`             | ✅                                                                                                                                                                                                    |
| 4   | `Block`: `alternatingGroups`                                                                                                   | ✅                                                                                                                                                                                                    |
| 5   | `db:reset` + `db:seed` успешны; `Archetypes: 34`                                                                               | ✅                                                                                                                                                                                                    |
| 6   | `rounds-ladder.ts` — `pairedWithSchemaId` удалён                                                                               | ✅                                                                                                                                                                                                    |
| 7   | `alternating-group/` 8 файлов; `schema-pairing/` удалён                                                                        | ✅                                                                                                                                                                                                    |
| 8   | `alternatingGroupSchema` / `createAlternatingGroupSchema` shapes                                                               | ✅                                                                                                                                                                                                    |
| 9   | `alternating-group-api.schema.ts` — get/create/delete; нет `addMember`/`removeMember`                                          | ✅                                                                                                                                                                                                    |
| 10  | `archetypeAlternatingSetsParamsSchema` без `pairedWithSchemaId`; test-фикстура очищена; `pairedWithInnerRowId` не тронут       | ✅                                                                                                                                                                                                    |
| 11  | `lms/index.ts` + `package.json` exports — alpha order                                                                          | ✅                                                                                                                                                                                                    |
| 12  | `schema/admin.test.ts` + `schema-row/admin.test.ts` мигрированы; cascade test сбросил `SchemaPairing`-конечность               | ✅                                                                                                                                                                                                    |
| 13  | `grep packages/` = 0                                                                                                           | ✅                                                                                                                                                                                                    |
| 14  | 8 `analysis/` файлов синхронизированы; `00-meta/**` не тронут                                                                  | ✅                                                                                                                                                                                                    |
| 15  | `pnpm check-types` — 16/16                                                                                                     | ✅                                                                                                                                                                                                    |
| 16  | `pnpm lint` — 16/16, 0 warnings                                                                                                | ✅                                                                                                                                                                                                    |
| 17  | `pnpm test` — все пакеты pass                                                                                                  | ✅ (после ратифицированного WORKFLOW-001 fix — см. ниже)                                                                                                                                              |
| 18  | `pnpm dep:check` — 0 violations                                                                                                | ✅                                                                                                                                                                                                    |
| 19  | Husky pre-commit/pre-push clean; 0 skip-флагов                                                                                 | ✅ pre-commit зелёный на всех 5; pre-push при push                                                                                                                                                    |
| 20  | 3 per-layer atomic commits (+ docs commit)                                                                                     | ⚠️ **DEVIATION (user-ratified):** 4 code-коммита + 1 docs = 5. 4-й (`8c3a701b`) — ратифицированный WORKFLOW-001 fix. No squash, 0 skip-флагов                                                         |
| 21  | `git diff a94bebb6..HEAD` в пределах § 2 file list                                                                             | ⚠️ **DEVIATION (user-ratified):** WORKFLOW-001 fix добавляет `lms/label/platform.test.ts` — 1 файл вне § 2. Всё остальное в § 2. `apps/**` + api-server production endpoints/guards/mappers — 0 строк |

**#17 + #20 + #21 deviations** — все три суть прямое следствие одного user-ratified решения (WORKFLOW-001 inline-fix вместо defer на 8.3.7-pre). Сам мигрейшн 8.1c — без отклонений от § 2 / § 3 / § 6.
