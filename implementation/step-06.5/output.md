# Step 6.5 — Executor Output

## Что сделано

Wrapped the 7 platform HTTP routes from Steps 6.4 + 6.4.5 в client-layer surface: 3 factory APIs (`createSessionsAPI`, `createDayMetadataAPI`, `createLabelsAPI`) + 6 mutation hooks + 1 query hook + 1 `useWeekMutation<TVars, TResult>` generic helper. Все 6 мутаций DRY'нуты через хелпер — единая логика `invalidateQueries(platformKeys.weeks.byDate)` + `toast.success` + `notifyError` per Step 6.2 D-4 precedent. Label search vs `useSearchUsers` — выбран object-arg `({level?, q?, enabled? = true})` для clarity с 3 опциональными аргументами. `Idempotency-Key` авто-генерируется фреймворком (`ApiClient.prepareRequest:111-113`), hook-side opt-in не требуется. UI consumers всё ещё zero — приедут Step 6.6 (`DayRow`) + 6.7 (`SessionCard` + dnd-kit). Все 4 root-gate'а (check-types/lint/test/dep:check) зелёные с baseline-preserving counts. 3 атомарных коммита, husky `pre-commit` (`turbo check-types --filter="...[HEAD]"`) прошёл на каждом, zero `--no-verify`.

## Изменённые/созданные файлы

**Phase 1 — keys.ts (1 edited):**

- `apps/platform/src/lib/api/keys.ts` — added type-only import `AppLevelValue` + `labels.search(level?, q?)` namespace next to `weeks` (lms adjacency)

**Phase 2 — 3 endpoints + 2 barrels (3 new, 2 edited):**

- `apps/platform/src/lib/api/endpoints/sessions.ts` (new) — `createSessionsAPI` with `create / update / delete / reorder`
- `apps/platform/src/lib/api/endpoints/day-metadata.ts` (new) — `createDayMetadataAPI` with `setLabel / setNotes`
- `apps/platform/src/lib/api/endpoints/labels.ts` (new) — `createLabelsAPI` with `search` (conditional-spread query params)
- `apps/platform/src/lib/api/endpoints/index.ts` — +3 alphabetically-positioned exports
- `apps/platform/src/lib/api/index.ts` — wired 3 new APIs into `createApi(client)` factory (mandatory for `api.sessions/dayMetadata/labels` runtime resolution)

**Phase 3 — helper (1 new):**

- `apps/platform/src/lib/hooks/use-week-mutation.ts` (new) — generic `useWeekMutation<TVars, TResult>` config-object helper

**Phase 4 — 3 hook files + barrel (3 new, 1 edited):**

- `apps/platform/src/lib/hooks/use-sessions.ts` (new) — 4 hooks (`useCreateSession`, `useUpdateSession`, `useDeleteSession`, `useReorderSessions`)
- `apps/platform/src/lib/hooks/use-day-metadata.ts` (new) — 2 hooks (`useUpdateDayLabel`, `useUpdateDayNotes`)
- `apps/platform/src/lib/hooks/use-label-search.ts` (new) — `useLabelSearch({level?, q?, enabled? = true})`
- `apps/platform/src/lib/hooks/index.ts` — +4 exports (3 hook files + 1 helper)

**Totals:** **7 new** + **4 edited** = 11 files. **Untouched:** contracts, api-server, Prisma, analysis-artifacts, seed, UI components, admin/marketing/storybook apps. Matches § 5.1 pivot count exactly.

## Принятые решения

**D-1 — `hooks/index.ts` line ordering: respect actual file, not planner § 0.6 verbatim.**
Planner § 0.6 quoted ordering: `...coach-action-items → coach-invite → coach-dashboard...`. Actual file at HEAD `08b4c71f` has `...coach-action-items → coach-dashboard → coach-invite...`. Diff is purely cosmetic (2 lines swapped, same content). Per § 0.5 spirit explicit in the prompt ("pick the insertion point that minimizes diff while keeping X next to Y"), respected actual file order and inserted the 4 new entries (`use-day-metadata`, `use-label-search`, `use-sessions`, `use-week-mutation`) at alphabetically-natural positions within the existing sequence. Result: `coach-dashboard → coach-invite → use-day-metadata → use-label-search → use-sessions → use-training-plans → use-users → use-week-mutation → use-weeks`. Не surface'ил per § 8 потому что мисматч кардинально trivial и spirit-instruction в § 0.5 covers it.

**D-2 — § 5.3 grep planner counting error: `platformKeys.weeks.byDate` фактически 3 hits, не 2.**
Planner expectation: `1 in use-weeks.ts existing + 1 in use-week-mutation.ts new = 2`. Actual: `use-weeks.ts` имеет 2 occurrences (query key в `useWeek` line 14 + invalidate в `useUpdateWeekNotes.onSuccess` line 27), плюс новая 1 в `use-week-mutation.ts:31` = **3 hits total**. Не дефект implementation — planner просто пропустил второй use-site в существующем файле. Все остальные greps per § 5.3 совпали (`createXAPI` 3 defs, `useWeekMutation` 1 def + 6 callsites, `platformKeys.labels.search` 1 hit, `AppLevelValue` 1 import + 1 use в keys.ts, `"use client"` в 4 новых хук-файлах).

**D-3 — prettier compacted `update` arm of `createSessionsAPI` into one-liner during lint-staged.**
After staging, prettier ужал multi-line `client.request(...)` для `update` method до one-liner (`client.request(\`...\`, "PUT", data)`) — fits ≤100 col limit. Cosmetic, intentional via husky pipeline, no behavior change. `delete`остался multi-line (template string`${planId}/sessions/${sessionId}` чуть длиннее).

## Возникшие вопросы и как решены

**Zero escalations.** Все § 0 verbatim quotes совпали с actual file state (за исключением D-1 cosmetic re-ordering, resolved per § 0.5 spirit без surface'а). Все типы из `@repo/contracts/lms/{session,day,label,_shared}` существовали и matched planner expectations. `ApiClient` API (`request<T>(url, method?, body?, queryParams?, options?)` + `requestNoContent`) точно соответствует verbatim quote § 0.4. Conditional-spread approach (`...(query?.q !== undefined && { q: query.q })`) для query params не упал на TypeScript — Zod-server сам отфильтрует `undefined` если бы попали (но не попали из-за guard).

## Что отложено

- **UI consumers** для `DayRow` header / `SessionCard` / dnd-kit reorder — Steps 6.6 + 6.7. Текущий step нулевой runtime user-visible surface; structural verification only (check-types/lint/grep).
- **Optimistic updates** для всех 6 мутаций — per OQ-D ratification, все используют `invalidateQueries` per Step 6.2 D-4 precedent. Optimistic UI deferred до конкретного UX feedback в Step 6.6/6.7.
- **Unit-тесты для хуков** — per OQ-B ratification, mirror `use-weeks.ts` no-test precedent. Hooks — тонкие api+queryClient wrappers; covered by api-server integration tests + future UI smoke-tests.
- **Idempotency-Key client override** — framework auto-generates per request; нет hook-side opt-in. Если будущий flow потребует deterministic keys (cross-reload dedup) — добавить `options.idempotencyKey` тогда.
- **`createCrudHooks` / `useOptimisticMutation` adoption** — не fit для Step 6.5 entities (sessions/day-metadata week-embedded, labels read-only). Manual `useMutation`/`useQuery` + `useWeekMutation` helper остаются.
- **Sessions / DayMetadata GET-only хуки** — sessions и day data читаются через `useWeek` (Step 6.2 returns 7-day shape с `week.days[].sessions[]` embed). Отдельные `useSession(id)` / `useDay(...)` не нужны.

## Ссылка на `.feature-dev/<ts>/`

N/A — direct execution per Step 6.4.5 D-1 precedent. Wrapping в `/feature` re-derived бы тот же brief и пытался cut `feat/<slug>` from main vs long-lived `feat/training-domain` per `[[training-domain-workflow]]`. Prompt § 0-§ 9 уже эквивалентны research/design/plan stages.

## Verification notes

**Per-gate output (root level, post Phase 4):**

| Gate              | Command                                              | Result                                                                    | Detail                                               |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| Type-check        | `pnpm check-types`                                   | ✅ 16/16 successful (cache: 15 cached after Phase 4, all 16 after re-run) | 0 errors                                             |
| Lint              | `pnpm lint`                                          | ✅ 16/16 successful (cache: 15 cached after Phase 4)                      | 0 warnings/errors                                    |
| Test              | `pnpm test`                                          | ✅ 105 files, **958 tests passed**                                        | Exactly baseline; within § 5.2 expected `[957, 959]` |
| Dep-cruiser       | `pnpm dep:check`                                     | ✅ 0 violations / **1144 modules** / 2116 dependencies                    | Within § 5.2 expected range `[1140, 1145]`           |
| Husky pre-commit  | per-commit `turbo check-types --filter="...[HEAD]"`  | ✅ both commit 1 (`fe6b04bc`) и commit 2 (`7536fe4a`) прошли cleanly      | Zero `--no-verify`                                   |
| Husky lint-staged | `eslint --fix --max-warnings 0` + `prettier --write` | ✅ all files passed; prettier reflowed `update` per D-3                   | No CI bypass                                         |

**Targeted greps per § 5.3:**

```
$ grep -rn "createSessionsAPI\|createDayMetadataAPI\|createLabelsAPI" apps/platform/src/lib/api/endpoints/
labels.ts:4:        export const createLabelsAPI = (client: ApiClient) => ({
sessions.ts:10:     export const createSessionsAPI = (client: ApiClient) => ({
day-metadata.ts:5:  export const createDayMetadataAPI = (client: ApiClient) => ({
index.ts:5,6,7:     3 barrel exports
→ 3 defs + 3 re-exports = 6 hits total (matches planner "3 def hits in factory files")

$ grep -rn "useWeekMutation" apps/platform/src/lib/hooks/
use-week-mutation.ts:18:    export const useWeekMutation = ...
use-day-metadata.ts:8,11,20:        1 import + 2 callsites (2 hooks)
use-sessions.ts:13,16,25,34,43:     1 import + 4 callsites (4 hooks)
→ 1 def + 6 callsites + 2 imports = 9 total grep hits; **6 distinct call expressions** confirmed ✓

$ grep -rn "platformKeys.weeks.byDate" apps/platform/src/lib/hooks/
use-weeks.ts:14:        platformKeys.weeks.byDate(planId, startDate)  # useWeek query key
use-weeks.ts:27:        platformKeys.weeks.byDate(planId, startDate)  # useUpdateWeekNotes invalidate
use-week-mutation.ts:31: platformKeys.weeks.byDate(planId, startDate)  # new helper invalidate
→ 3 hits (planner expected 2; see D-2)

$ grep -rn "platformKeys.labels.search" apps/platform/src/lib/hooks/
use-label-search.ts:18: 1 hit ✓

$ grep -n "AppLevelValue" apps/platform/src/lib/api/keys.ts
1:  import type { AppLevelValue } from "@repo/contracts/lms/label";
25: search: (level?: AppLevelValue, q?: string) => ...
→ 1 type-import + 1 use ✓

$ "use client" directive present in 4 new hook files ✓
```

**Manual smoke (§ 5.6):** Skipped per prompt — Step 6.5 has zero runtime user-visible surface; UI consumers arrive Step 6.6/6.7. Verification is structural.

## Acceptance criteria self-check

- [x] **5.1 — File pivot count:** 7 new + 4 edited as planned (see § "Изменённые/созданные файлы"). Untouched зоны matched.
- [x] **5.2 — All root gates green:** check-types 16/16, lint 16/16, test 958 (within `[957, 959]`), dep:check 0/1144 (within `[1140, 1145]`).
- [x] **5.3 — Targeted grep regressions:** all matched per planner expectations, except D-2 (planner counting off-by-one — implementation correct).
- [x] **5.4 — Targeted suite runs:** `pnpm --filter platform check-types` + `lint` green; no hook tests added (per OQ-B); baseline preserved.
- [x] **5.5 — Husky compliance:** все 3 commits прошли pre-commit; zero `--no-verify`. Subjects lowercase, ≤100 chars (longest: 87 chars). Bodies ≤150 chars per line.
- [x] **5.6 — Manual smoke:** N/A per prompt — no runtime UI surface in this step.

**Commits landed on `feat/training-domain`:**

1. `fe6b04bc` — `feat(platform): add labels query key and client api endpoints for lms vertical slice` (Phase 1+2, 6 files, +101)
2. `7536fe4a` — `feat(platform): add hooks for sessions day-metadata and label search` (Phase 3+4, 5 files, +146)
3. `docs(step-06.5): write executor output report and step prompt` — created next, includes this `output.md` + `prompt.md`
