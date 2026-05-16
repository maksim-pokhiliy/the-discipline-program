# Step 6.3 — Output report

## Что сделано

Добавлен read-only platform mirror каталога labels — `lmsLabelPlatformApi.list(userId, query?)` — чтобы будущие UI-шаги (6.6 + 6.7) могли тянуть автокомплит Day-label / Session-label через server-side фильтрацию + cap, не давая coach-пользователям admin-роль.

Скоуп ровно по prompt'у, без расширений:

- **Contracts (commit `4aca6ea0`)**: `labelSearchParamsSchema = z.object({ q?: string.min(1).max(200) })` + `LabelSearchParams` type. Response shape переиспользует `getLabelsResponseSchema = z.array(labelSchema)` — отдельного `labelSearchResponseSchema` алиаса не вводил (KISS; admin и platform отдают идентичный array, если platform позже разойдётся — экстрактим тогда).
- **API-server (commit `29901fe3`)**: `lmsLabelPlatformApi.list(userId, query?)` в новом `packages/api-server/src/endpoints/lms/label/platform.ts`. Auth: `requireCoachLikeRole` снаружи. Опциональный case-insensitive `nameLower contains q.toLowerCase()`, sort `nameLower asc`, hardcoded module-local `LABEL_SEARCH_CAP = 50`.
- **Structural-symmetry fix**: добавил `endpoints/lms/label/index.ts` (was missing — асимметрия vs sibling-папкам), и flip `endpoints/lms/index.ts` строки `./label/admin` → `./label`. `cmsLabelAdminApi` остался reachable через новый barrel.
- **Тесты**: 11 интеграционных кейсов в `platform.test.ts` (10 required + 1 bonus sort). Покрытие — authz (non-coach reject, COACH/HEAD_COACH/ADMIN allow), substring/case-insensitive/mid-string/no-match search, cap enforcement (60→50), SQL-safe special chars, sort order.

HTTP route, platform client API, hook, UI — out of scope (Steps 6.4/6.5/6.6+).

## Изменённые/созданные файлы

**Edited (3)**:

- `packages/contracts/src/entities/lms/label/label-api.schema.ts` — добавлен `labelSearchParamsSchema`.
- `packages/contracts/src/entities/lms/label/label-api.types.ts` — добавлен `LabelSearchParams` type + import.
- `packages/api-server/src/endpoints/lms/index.ts` — flip `./label/admin` → `./label` (1 line).

**Created (3)**:

- `packages/api-server/src/endpoints/lms/label/platform.ts` — `lmsLabelPlatformApi` (23 lines).
- `packages/api-server/src/endpoints/lms/label/index.ts` — barrel `export * from "./admin"; export * from "./platform";` (2 lines).
- `packages/api-server/src/endpoints/lms/label/platform.test.ts` — 11 integration test cases.

Zero Prisma changes, zero analysis-artifacts edits, zero seed changes, zero apps/\* changes, zero existing api-server endpoint logic changes.

## Принятые решения

1. **No `labelSearchResponseSchema` alias** — переиспользую `getLabelsResponseSchema = z.array(labelSchema)` напрямую. Admin и platform возвращают идентичный массив; алиас сейчас не добавляет ценности. Если platform позже разойдётся (cursor pagination, slim payload), экстрактим тогда. Прямо по prompt § 3.1.1 rationale.
2. **Folder symmetry fix scope** — добавил `endpoints/lms/label/index.ts` (асимметрия vs `lms/{session,week,training-plan,plan-enrollment,day}/`). `endpoints/lms/exercise/` оставил without index.ts (orthogonal — out of scope; см. `## Что отложено`).
3. **`LABEL_SEARCH_CAP = 50`** — module-local const, не conf-driven, не client-overridable. Defence vs scraping.
4. **`query !== undefined` over `!!query`** — пустая строка `""` проходит `!!` тест и в Prisma `contains: ""` матчит всё. Zod `.min(1)` валидирует на HTTP-слое (Step 6.4); endpoint доверяет своему inpт'у, но не подставляет тривиально match-all.
5. **No trim / no ZWS-strip в endpoint'е** — raw query идёт в Prisma. Нормализация — concern HTTP-слоя (Step 6.4) если понадобится. Asymmetric vs admin label-input zero-width-strip behavior — flagged.
6. **`mapToLabel` via `mappers/lms` barrel** — соответствует pattern'у admin.ts.

### Минор-отклонение от prompt'а (deliberate)

**`platform.ts` Prisma `findMany` — conditional spread for `where`** вместо verbatim'ного `where: query !== undefined ? {...} : undefined`. Причина: проект собирается с `exactOptionalPropertyTypes: true` (`packages/typescript-config/base.json:10`), который отклоняет передачу `where: undefined` (TS2379 на verbatim'ной форме). Не уход в сторону — наоборот, **pattern-aligned с siblin'ом**: `admin.ts:16-23` (`buildLabelUpdateData`) использует ровно тот же `...(field !== undefined && { ... })` идиом для conditional optional fields. Semantically identical — `where` присутствует iff `query !== undefined`. Independent review (см. `.feature-dev/1778922338/review.md`) подтверждает.

Финальная форма:

```ts
const rows = await prisma.label.findMany({
  ...(query !== undefined && {
    where: { nameLower: { contains: query.toLowerCase() } },
  }),
  orderBy: { nameLower: "asc" },
  take: LABEL_SEARCH_CAP,
});
```

## Возникшие вопросы и как решены

1. **`labelSchema` shape mismatch with prompt § 2 summary**: prompt'овая summary line "id, name, nameLower, applicableLevels, notes, ts" расходится с реальным `labelSchema` (использует `createdAt` + `updatedAt`, не `ts`). Реальная file content в `label.schema.ts:22-30` — `createdAt: z.date(), updatedAt: z.date()`. Все actionable spec-секции (§ 3.1/3.2) используют `Label[]` через `mapToLabel`, который выдаёт `createdAt`/`updatedAt` — внутренне consistent. Только line summary неточная. Не блокер; продолжил.
2. **`exactOptionalPropertyTypes: true` rejects verbatim § 3.2.1 snippet** — описано в `## Принятые решения` выше. Minor adjustment, не structural deviation per /feature small spec ("Minor adjustments OK: renamed parameter, reordered fields, null guard, validation tweak"). Это validation-tweak уровня.
3. **Optional § 3.1.3 contract tests** — strict reading prompt'а ("If there's an existing `*.test.ts` file other than the schema test mentioned in Step 4...") → skip. Существует только `label.schema.test.ts` (Step 4 schema test). 4 zod-кейсов для `labelSearchParamsSchema` приедут через HTTP-route валидацию в Step 6.4.

## Что отложено

- **`endpoints/lms/exercise/index.ts` structural symmetry fix** — та же асимметрия, что у label/ до фикса. Можно 1-commit cleanup'ом в любом следующем Step 6.x close-out.
- **Symbol rename `cmsLabelAdminApi` → `lmsLabelAdminApi`** — carry-forward from Step 6.1.5 deferred follow-up. Step 6.3 ввёл `lmsLabelPlatformApi` с правильным префиксом from start.
- **`?q=` trim / zero-width-strip normalization** — Step 6.4 HTTP-слой concern (если понадобится).
- **GIN trgm index для `nameLower`** — perf оптимизация для catalog > 1k labels. Не нужна сейчас (~100).
- **`labelSearchResponseSchema` alias** — extract'нем, если platform разойдётся с admin response shape.
- **Pagination / cursor** — hardcoded `take: 50`; deferred indefinitely.

## Ссылка на `.feature-dev/<ts>/`

`.feature-dev/1778922338/` — `research.md` + `review.md`. Independent reviewer's verdict: **APPROVED**, zero CRITICAL/WARNING/INFO findings across 6 files / +265 LOC. Reviewer confirmed `exactOptionalPropertyTypes: true` at `packages/typescript-config/base.json:10` validates the conditional-spread fix; called it "strictly better than the prompt" given the sibling pattern in `admin.ts:16-23`.

## Verification notes

**Phase 1 gate (§ 3.1.4) — passed pre-commit-1**:

- `pnpm --filter @repo/contracts check-types` ✓
- `pnpm --filter @repo/contracts lint` ✓
- `pnpm --filter @repo/contracts test` — 189/189 passed (no new cases per § 3.1.3 skip decision)
- `pnpm --filter @repo/api-server check-types` ✓ (additive — new symbol unused so far)

**Phase 2 gate (§ 3.2.5) — passed pre-commit-2**:

- `pnpm --filter @repo/api-server check-types` ✓ (after minor `exactOptionalPropertyTypes` fix; pre-fix produced TS2379 on verbatim § 3.2.1 snippet)
- `pnpm --filter @repo/api-server lint` ✓
- `pnpm --filter @repo/api-server test` — 538/538 passed (~10 new cases, see counts below); duration 305.35s per `[[api-server-serial-tests]]` constraint

**Phase 3 global verification (§ 3.3)**:

- `pnpm check-types` (root) — 16/16 FULL TURBO cached, 186ms ✓
- `pnpm lint` (root) — 16/16, 20.96s ✓
- `pnpm dep:check` — `no dependency violations found (1127 modules, 2076 dependencies cruised)` ✓
- `pnpm test` (root) — 104 test files / 937 tests passed, 344.29s; expected range ~926 → ~936-939 hit ✓

**Grep regressions (§ 3.3 + § 5)**:

- `grep -rn "cmsLabelAdminApi" packages/api-server/src/endpoints/lms/label/admin.ts` → 2 hits (definition + internal self-reference at line 105) — existing admin symbol intact ✓
- `grep -rn "lmsLabelPlatformApi" packages/api-server/src/endpoints/lms/label/platform.ts` → 1 hit (definition) ✓
- `grep -rn "@repo/contracts/cms/label" apps packages` → 0 hits — no Step 6.1.5 regression ✓
- Barrel resolution: `endpoints/lms/index.ts` → `./label` (new barrel) → `./admin` + `./platform` — both `cmsLabelAdminApi` and `lmsLabelPlatformApi` reachable through the top barrel. Verified by `pnpm --filter @repo/api-server check-types` passing — TS-driven proof since admin.test.ts imports `cmsLabelAdminApi` from `./admin` and works without diff churn.

**Husky hooks**:

- Pre-commit ran on both commits: `node scripts/check-secrets.mjs` + `lint-staged` + `turbo run check-types --filter="...[HEAD]"` — passed both times (commit 1 ran 16/16 fresh; commit 2 ran 15/15 with cache hits).
- Pre-push (`dep:check + lint check-types --filter="...[origin/main]"`) — not yet exercised (no push attempt this session).
- No `--no-verify` / `--no-edit` / `--no-gpg-sign` used.

**Сценарий смоук-теста**: **N/A** — api-server-only step, no user-visible surface yet (per § 3.3 explicit). Smoke-test arrives in Step 6.6 / 6.7 (UI autocomplete consumers).

**Commit hashes**:

- `4aca6ea0` — feat(contracts): add label search params schema for platform mirror
- `29901fe3` — feat(api-server): add lms label platform api with structural label/index barrel

## Acceptance criteria self-check

- [x] All Phase 1 + Phase 2 verifications pass — see Verification notes.
- [x] File pivot counts match § 5:
  - 0 new files in contracts (edits only) ✓
  - 3 new files in api-server (`platform.ts`, `index.ts`, `platform.test.ts`) ✓
  - 3 edited files (2 contracts + 1 api-server `lms/index.ts`) ✓
  - 0 Prisma, 0 analysis-artifacts, 0 seed, 0 apps/, 0 existing endpoint-logic changes ✓
- [x] Test deltas: +11 new cases in `platform.test.ts` (matches "+~10" target; bonus sort case counted). Skipped optional § 3.1.3 contract tests per strict spec reading. Api-server: 527 → 538 (+11). Root: ~926 → 937 (+11), inside expected ~936-939 range.
- [x] Regression guards:
  - [x] `cmsLabelAdminApi` in admin.ts: 2 hits
  - [x] `lmsLabelPlatformApi` in platform.ts: 1 hit
  - [x] `@repo/contracts/cms/label` across apps/packages: 0
  - [x] Both symbols reachable through `endpoints/lms/index.ts` (TS-driven proof via check-types)
- [x] 2 atomic commits on `feat/training-domain` per § 7; subjects + bodies within 100/150 char caps; no `--no-verify`.
- [x] Smoke-test status: N/A (api-server-only).
