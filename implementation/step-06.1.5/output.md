# Step 6.1.5 — `Label` + `Exercise` namespace move (`cms/*` → `lms/*`) — Output

## Что сделано

Пять deliverables из prompt'а исполнены за одну `/feature small` сессию на ветке `feat/training-domain`. `Label` и `Exercise` (контракты + api-server endpoints + api-server mappers) переехали из `cms/*` в `lms/*` namespace согласно D8 ratified. Pure path-and-import refactor — ноль behaviour change, ноль Prisma changes, ноль analysis-artifacts touches, ноль seed changes, ноль новых тестов.

D8 unblock: Step 6.2 `getWeekResponseSchema` embed `label: Label | null` теперь импортируется из `@repo/contracts/lms/label` в `lms/week` без нарушения `contracts-lms-no-coaching-cms-billing` (`.dependency-cruiser.cjs:47-58`).

## Изменённые/созданные файлы

**Контракты** (`packages/contracts/`, 14 файлов перемещены + 2 модифицированы):

- `src/entities/cms/label/{index,label-api.schema,label-api.types,label.constants,label.schema,label.schema.test,label.schema,label.types}.ts` → `src/entities/lms/label/...` (7 файлов, 313 LOC, byte-identical контент)
- `src/entities/cms/exercise/{index,exercise-api.schema,exercise-api.types,exercise.constants,exercise.schema,exercise.schema.test,exercise.schema,exercise.types}.ts` → `src/entities/lms/exercise/...` (7 файлов, 393 LOC, byte-identical контент)
- `src/entities/lms/index.ts` — barrel additive (+2 lines: `./exercise`, `./label` в alphabetical order)
- `package.json` — exports map: −2 `./cms/{exercise,label}` записи, +2 `./lms/{exercise,label}` записи

**api-server** (`packages/api-server/src/`, 6 файлов перемещены + 6 модифицированы + 1 создан):

- `endpoints/cms/label/{admin,admin.test}.ts` → `endpoints/lms/label/...` (109 + 264 LOC)
- `endpoints/cms/exercise/{admin,admin.test}.ts` → `endpoints/lms/exercise/...` (153 + 313 LOC)
- `mappers/cms/label.mapper.ts` → `mappers/lms/label.mapper.ts` (13 LOC)
- `mappers/cms/exercise.mapper.ts` → `mappers/lms/exercise.mapper.ts` (24 LOC)
- `mappers/lms/exercise.enum-maps.ts` — **создан** (109 LOC): извлечены 6 Exercise enum-maps (`EQUIPMENT_MAP`, `equipmentToPrisma`, `MOVEMENT_TYPE_MAP`, `movementTypeToPrisma`, `CANONICAL_COMPOUND_TYPE_MAP`, `canonicalCompoundTypeToPrisma`) из бывшего `mappers/cms/enum-maps.ts`. Import `ExerciseCanonicalCompoundType` / `ExerciseEquipment` / `ExerciseMovementType` теперь из `@repo/contracts/lms/exercise`.
- `mappers/cms/enum-maps.ts` — **shrunk** (155 → 47 LOC): только CMS-pure остался (Currency / PriceInterval / BlogCategory / ContactStatus); Exercise enums удалены вместе с `@repo/contracts/cms/exercise` импортом и `@prisma/client` `Equipment`/`MovementType`/`CanonicalCompoundType` импортами.
- `endpoints/cms/index.ts` — barrel: −2 lines (`./exercise/admin`, `./label/admin`)
- `endpoints/lms/index.ts` — barrel additive: +2 lines (`./exercise/admin`, `./label/admin` в alphabetical order)
- `mappers/cms/index.ts` — barrel: −2 lines (`./exercise.mapper`, `./label.mapper`)
- `mappers/lms/index.ts` — barrel additive: +3 lines (`./exercise.enum-maps`, `./exercise.mapper`, `./label.mapper` в alphabetical order)

**Self-consumer manual edits внутри перемещённых файлов** (sed-uncovered substring substitutions):

- `endpoints/lms/label/admin.ts` line 12: `from "../../../mappers/cms"` → `from "../../../mappers/lms"` (label.mapper переехал)
- `endpoints/lms/exercise/admin.ts` line 12-17: `from "../../../mappers/cms"` → `from "../../../mappers/lms"` (exercise.mapper + enum-maps переехали)
- `mappers/lms/exercise.mapper.ts` line 5: `from "./enum-maps"` → `from "./exercise.enum-maps"` (relative-path после split; раньше `./enum-maps` указывал на cms/enum-maps содержащий Exercise enums)

**apps/admin** (29 файлов: 27 контракт-substring + 7 package-substring, 5 файлов имеют обе substring):

`@repo/contracts/cms/{label,exercise}` → `@repo/contracts/lms/{label,exercise}` (27 файлов, mechanical sed):

- 11 label consumers: `app/api/admin/labels/{,[id]/,page-data/}route.ts`, `lib/api/endpoints/labels.ts`, `lib/hooks/use-labels.ts`, `modules/labels/{constants,components/{applicable-levels-field,label-form},sections/labels-list-section,views/labels-{create,edit}-view/...}.{ts,tsx}`
- 16 exercise consumers: `app/api/admin/exercises/{,[id]/,page-data/,movement-families/}route.ts`, `lib/api/endpoints/exercises.ts`, `lib/hooks/use-exercises.ts`, `modules/exercises/{constants,components/{basic-info-card,classification-card,demos-and-aliases-card,enum-select-field,notes-card,secondary-movement-select},sections/exercises-list-section,views/exercises-{create,edit}-view/...}.{ts,tsx}`

`@repo/api-server/cms` → `@repo/api-server/lms` (7 файлов, surgical sed filtered by `cms{Label,Exercise}AdminApi` symbol presence):

- `app/api/admin/labels/{,[id]/,page-data/}route.ts`
- `app/api/admin/exercises/{,[id]/,page-data/,movement-families/}route.ts`

**dep-cruiser** (`.dependency-cruiser.cjs`, 1 файл модифицирован):

- Rule `admin-no-lms` `pathNot[]`: +4 новых записи —
  - `^packages/api-server/src/endpoints/lms/label/[^/]+\.ts$`
  - `^packages/api-server/src/endpoints/lms/exercise/[^/]+\.ts$`
  - `^packages/api-server/src/mappers/lms/label\.mapper\.ts$`
  - `^packages/api-server/src/mappers/lms/exercise\.enum-maps\.ts$`
- Существующие residue-записи `library/*` сохранены verbatim (по prompt §3.4.1 — out of scope).

**Итого**: 56 файлов изменено, +173/−159 LOC (per `git diff --stat`).

## Принятые решения

### D-OUTPUT-1 — Squashed 4 prompt-defined commits into 1

**Контекст:** prompt § 7 предписывал 4 atomic per-layer commits с заметкой "Root-level `pnpm check-types` will fail until Phase 3 completes. Do not run root-level checks between commits 1 and 3." Однако `.husky/pre-commit` (line 3) запускает `SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"` после каждого `git commit` — что включает все downstream packages и блокирует intermediate broken-import trees. Попытка Commit 1 (contracts move) сразу зарежекчена hook'ом: `@repo/api-server:check-types` падает с `Cannot find module '@repo/contracts/cms/label'`.

**Hypothesis (planner discipline lesson):** четвёртый-flavour planner-instinct miss (после `[[planner-verbatim-registration]]`, `[[planner-adversarial-review]]`, и engineering-naivety из Step 6.1) — отсутствие адверсариал-проверки commit-strategy против live hook config. Команды `--no-verify` запрещены глобально и по prompt'у; root cause = prompt commit-plan не учёл husky pipeline.

**Решение:** после `AskUserQuestion` user'у с двумя альтернативами (reorder-with-deprecation-shim vs squash-to-1-commit), user выбрал squash. Один commit `5332c034 refactor(training-domain): move label and exercise from cms to lms namespace` содержит все 5 deliverables. Body-секция документирует squash-reason и перечисляет 4 sub-changes явно (так что revertability остаётся on per-layer logical-grouping basis через `git revert` + manual surgery).

**Trade-off:** теряется per-layer revert-granularity, которая dispatched как принцип WORKFLOW. Сохраняется в commit body как logical-grouping. Из плюсов — один atomic commit проще для review и rollback как единого юнита (что для pure-refactor актуальнее, чем staged rollback).

### D-OUTPUT-2 — Symbol names `cms{Label,Exercise}AdminApi` preserved verbatim

**Контекст:** перемещённые api-server endpoints export `cmsLabelAdminApi` / `cmsExerciseAdminApi` — symbol-имена несут `cms` prefix, хотя после move сами файлы живут в `endpoints/lms/`. Семантическая несогласованность.

**Решение:** не переименовывать. Prompt § 1 ratifies "Pure path-and-import refactor"; § 4 explicitly forbids "Improving moved code along the way ('I noticed this could be cleaner — let me refactor while I'm here'). NO. Move byte-identical."

**Follow-up:** rename в отдельный atomic PR. Estimated blast radius: 7 admin route handlers + 2 api-server self-exports + 4 test files (`cmsLabelAdminApi` / `cmsExerciseAdminApi` → `lmsLabelAdminApi` / `lmsExerciseAdminApi`). Mechanical sed после Step 6.x stabilizes.

### D-OUTPUT-3 — Extra `@repo/api-server/cms` → `@repo/api-server/lms` substitution in 7 admin route files

**Контекст:** prompt § 3.3.1 описал только `@repo/contracts/cms/{label,exercise}` → `@repo/contracts/lms/{label,exercise}` substitution. После Phase 2 переноса `endpoints/cms/{label,exercise}/admin.ts` → `endpoints/lms/{label,exercise}/admin.ts` и удаления `./exercise/admin` + `./label/admin` из `endpoints/cms/index.ts` barrel, 7 admin route handlers (которые импортировали `cmsLabelAdminApi` / `cmsExerciseAdminApi` из `@repo/api-server/cms` package barrel) перестали резолвиться. tsc подтвердил: `Module '"@repo/api-server/cms"' has no exported member 'cmsLabelAdminApi'`.

**Решение:** дополнительная surgical sed (filtered by `cms{Label,Exercise}AdminApi` symbol presence в файле — чтобы не задеть другие cms consumers типа `cmsBlogAdminApi`): `@repo/api-server/cms` → `@repo/api-server/lms` в этих 7 файлах. Это в пределах prompt § 5 acceptance criteria range "27-34 admin consumer files" (27+7 = 34 — попадает в upper bound).

### D-OUTPUT-4 — `mappers/lms/enum-maps.ts` parenthetical drift

**Контекст:** prompt § 4 last bullet says "currently 1 line — `export * from ...` doesn't exist there". Live state: `mappers/lms/enum-maps.ts` IS exactly `export * from "./enum-maps-status";` (1-line re-export); actual symbols (`ENROLLMENT_STATUS_MAP`, `TRAINING_PLAN_STATUS_MAP`, `ENROLLMENT_STATUS_TO_PRISMA_MAP`, `TRAINING_PLAN_STATUS_TO_PRISMA_MAP`) живут в sibling `enum-maps-status.ts`. ROLE_MAP не существует — также имя slight imprecision.

**Решение:** не halt, продолжать. Actionable directive ("Leave alone") корректен; parenthetical — это slight terminological imprecision о _форме_ файла, не о его _действии_ в этом step. Новый `exercise.enum-maps.ts` не конфликтует с существующим `enum-maps.ts` (zero overlapping exported symbols). Flag как planner-side note для close-out lesson.

## Возникшие вопросы и как решены

### Q1 — Husky pre-commit hook блокирует prompt's 4-commit strategy

Уже описано в **D-OUTPUT-1**. Ответ: `AskUserQuestion` → user выбрал squash.

### Q2 — admin routes импортируют `cms{Label,Exercise}AdminApi` из `@repo/api-server/cms` (не из contracts)

Surface'нулось во время Phase 2 verification (admin check-types). Описано в **D-OUTPUT-3**. Ответ: surgical sed для 7 файлов; bounded by `cms{Label,Exercise}AdminApi` symbol filter, чтобы не задеть остальных cms consumers (`cmsBlogAdminApi`, etc.).

## Что отложено

- **Symbol rename `cms{Label,Exercise}AdminApi` → `lms{Label,Exercise}AdminApi`** — out of scope для pure-refactor step (D-OUTPUT-2). Mechanical sed в отдельный atomic PR; estimated 7 admin routes + 2 api-server self-exports + 4 test files. Можно сделать в close-out или отложить до stabilizing Step 6.x.
- **Memory hygiene sweep** — `~/.claude/projects/-home-maksym-projects-contrib-the-discipline-program/memory/` для stale `cms/{label,exercise}` refs (per prompt § 4 + § 6). Planner housekeeping для close-out lesson.
- **Прозрачный split commit pattern** в WORKFLOW.md — добавить guidance что для cross-package refactors с интермедиатными broken trees выбирать squash или reorder-with-shim. Не делал — planner-side housekeeping.
- **Pre-existing minor issues в перемещённом коде** — не заметил. Все 6 self-consumer файлов и enum-maps split проходят lint + check-types clean без warnings.

## Ссылка на `.feature-dev/<ts>/`

`.feature-dev/1778878441/` — содержит:

- `research.md` — pre-task verbatim verification results (6 barrels + package.json + dep-cruiser + file-size sanity); consumer counts; self-consumer rewrite inventory.
- `review.md` — review-light findings (manifesto conformance PASS, all 8 grep regressions zero; 2 out-of-scope flags: F1 symbol-name mismatch, F2 multi-line import formatting artifact).
- `.lock` — orchestrator concurrency marker.

## Сценарий смоук-теста

**Preconditions:**

- DB seeded per `[[discipline-program DB non-prod]]` (`pnpm --filter @repo/api-server db:seed`). Step 4 admin Label CRUD ratified seed expects at least 1 user (admin role).
- `pnpm dev` runs all apps (admin at port 3002).

**Steps:**

1. Open browser at `http://localhost:3002/admin/labels`.
   - **Expected:** Labels list page loads без errors. Если в БД есть seeded labels — they render. Если empty — empty state.
2. Click "Create" button.
   - **Expected:** Create label form renders (name, applicableLevels checkboxes, notes textarea).
3. Fill name = "smoke-test-label-6-1-5", applicableLevels = [DAY], notes = "step 6.1.5 smoke".
4. Click "Save".
   - **Expected:** Label persists, redirect to list view, new label appears.
5. Click new label → edit notes → "step 6.1.5 smoke — verified" → Save.
   - **Expected:** Updates persist.
6. Open `http://localhost:3002/admin/exercises`.
   - **Expected:** Exercises list page loads. If seeded — they render. If empty — empty state.
7. Click "Create" → fill canonical name "smoke-test-exercise-6-1-5", primary equipment BARBELL, movement type SQUAT, canonical compound type ATOMIC → Save.
   - **Expected:** Exercise persists.
8. Open created exercise → add demo URL (e.g. "https://example.com/demo.mp4") → Save.
   - **Expected:** `defaultDemoUrls` array updates.

**Rollback:**

- `git revert 5332c034` (squashed commit) или, если ещё не push'нуто на origin: `git reset --hard 6f09a8a4`.

## Verification notes

### Build / lint / test (root, 16/16 workspaces)

```
pnpm check-types  → 16 successful, 16 total (42.6s) ✓
pnpm lint         → 16 successful, 16 total (17.7s) ✓
pnpm test         → 101 test files / 874 tests passed (261s) ✓
pnpm dep:check    → ✔ no dependency violations found (1113 modules, 2032 dependencies cruised) ✓
```

api-server suite isolated (per `[[api-server-serial-tests]]` memory): 69 files / 504 tests passed (256s) — same baseline as Step 6.1 closing state. **No test deltas.**

contracts suite: 11 files / 160 tests passed (567ms) — same baseline (2 moved `.schema.test.ts` files unchanged byte-for-byte, still import siblings via relative paths preserved by `git mv`).

### 8 grep regression sweeps (all-zero)

```
grep -rn "@repo/contracts/cms/label"  apps packages --include='*.ts' --include='*.tsx' → 0
grep -rn "@repo/contracts/cms/exercise" apps packages --include='*.ts' --include='*.tsx' → 0
grep -rn "from.*mappers/cms/.*label"  packages --include='*.ts' → 0
grep -rn "from.*mappers/cms/.*exercise" packages --include='*.ts' → 0
grep -rn -E 'from "\./label\.mapper|from "\./exercise\.mapper' packages/api-server/src/mappers/cms → 0
grep -rn -E "endpoints/cms/(label|exercise)" packages apps --include='*.ts' --include='*.tsx' → 0
grep -rn -E "mappers/cms/(label|exercise)\.mapper" packages apps --include='*.ts' --include='*.tsx' → 0
grep -rn -E "@repo/api-server/cms.*cms(Label|Exercise)AdminApi" apps packages --include='*.ts' --include='*.tsx' → 0
```

### File-count tally vs prompt § 5 acceptance criteria

| Acceptance criterion                   | Expected                                                                                                | Actual                                                                                                                                                                                                                                              | Pass                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Files moved (git mv)                   | 20 (14 contracts + 4 api-server endpoints + 2 api-server mappers)                                       | 20                                                                                                                                                                                                                                                  | ✓                                          |
| Files created                          | 1 (`mappers/lms/exercise.enum-maps.ts`, ~100 LOC)                                                       | 1 (109 LOC)                                                                                                                                                                                                                                         | ✓                                          |
| Files size-reduced                     | 1 (`mappers/cms/enum-maps.ts` 156 → ~55 LOC)                                                            | 1 (155 → 47 LOC)                                                                                                                                                                                                                                    | ✓                                          |
| Barrel files edited                    | 6 (`contracts/lms/index`, `api-server/endpoints/{cms,lms}/index`, `api-server/mappers/{cms,lms}/index`) | 5 (`contracts/lms/index`, `api-server/{endpoints,mappers}/{cms,lms}/index`) — wait, тоже 5. Prompt сказал 6, but accurately считая: contracts/lms/index.ts + 4 api-server barrels = **5**, не 6. **Minor prompt math discrepancy**, не материально. | ✓ (5 actual; prompt said 6, off-by-one)    |
| Self-consumer file import-path updates | 6 (4 endpoints + 2 mappers)                                                                             | 9 import-path edits across 6 files (6 contract-path substitutions caught by Phase 3 sed + 2 manual mappers/cms→lms + 1 manual ./enum-maps→./exercise.enum-maps)                                                                                     | ✓                                          |
| Admin consumer files                   | 27-34                                                                                                   | 34 (27 contract substring + 7 api-server-package substring; некоторые files в both)                                                                                                                                                                 | ✓                                          |
| `package.json` edits                   | 1 (`contracts/package.json` exports: 2 del + 2 add)                                                     | 1                                                                                                                                                                                                                                                   | ✓                                          |
| `.dependency-cruiser.cjs` edits        | 1 (4 pathNot additions)                                                                                 | 1 (4 new entries)                                                                                                                                                                                                                                   | ✓                                          |
| Zero Prisma schema changes             | —                                                                                                       | confirmed (no `prisma/schema.prisma` edit)                                                                                                                                                                                                          | ✓                                          |
| Zero `analysis/artifacts/` changes     | —                                                                                                       | confirmed                                                                                                                                                                                                                                           | ✓                                          |
| Zero seed changes                      | —                                                                                                       | confirmed                                                                                                                                                                                                                                           | ✓                                          |
| Zero new tests                         | —                                                                                                       | confirmed                                                                                                                                                                                                                                           | ✓                                          |
| Zero new components/schemas/endpoints  | —                                                                                                       | confirmed                                                                                                                                                                                                                                           | ✓                                          |
| `pnpm dep:check` 0 violations          | 0/1112                                                                                                  | 0/1113                                                                                                                                                                                                                                              | ✓ (1 extra module = exercise.enum-maps.ts) |

### Commit hashes

- **`5332c034`** `refactor(training-domain): move label and exercise from cms to lms namespace` — squashed all 5 deliverables (contracts move + api-server move + enum-maps split + admin imports + dep-cruiser carve-out).
- **TBD** `docs(step-06.1.5): write executor output report` — this output.md.

(Note: prompt § 7 expected 4 commits; squashed to 1 per D-OUTPUT-1. Subject + body document the squash reason explicitly.)

## Acceptance criteria self-check

Prompt § 5 acceptance criteria — all met (see Verification notes file-count tally). Specifically:

- [x] All 5 Phase verifications pass (Phase 1 contracts + Phase 2 api-server + Phase 3 admin + Phase 4 dep-cruiser + Phase 5 global)
- [x] File pivot counts exactly как enumerated (modulo prompt's barrel off-by-one)
- [x] Zero Prisma schema / analysis-artifacts / seed changes
- [x] Zero new tests / endpoints / schemas / components
- [x] `pnpm dep:check` 0/1113 violations
- [x] All 8 grep regressions all-zero
- [x] Commits on `feat/training-domain` per § 7 ordering — **deviation:** 1 squashed commit вместо 4 atomic; D-OUTPUT-1 explains; no `--no-verify` used
- [x] Manual smoke не run executor'ом (no dev server в этой сессии); сценарий prepared в **Сценарий смоук-теста** section выше, user runs in browser

Step 6.2 prompt-writing unblocked.
