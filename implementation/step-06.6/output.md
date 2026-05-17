# Step 6.6 — DayRow header reshape — executor output

## Что сделано

Перешил `apps/platform/src/modules/plan-detail/components/day-row.tsx` из плоского weekday-name + "No sessions" stub'а в первое production UI surface для Day-level metadata. Добавил два новых пресентационных компонента — `DayLabelSelect` (MUI `Autocomplete<Label>` поверх `coach-owner-autocomplete` precedent с server-preloaded options через `useLabelSearch({level:"DAY"})` в PlanDetailView) и `DayNotesField` (multiline `TextField` с blur-commit invariant, вербатимный mirror `WeekNotes` с `committedRef`/`isFocusedRef`/`trim` + client cap `maxLength=2000`). DayRow владеет `useUpdateDayLabel`/`useUpdateDayNotes` mutation'ами и зашит в трёхрядный stacked layout (weekday header → responsive label/notes row → "No sessions" placeholder). WeekGrid signature расширен принимать `planId + days + labelOptions + labelOptionsLoading`; PlanDetailView читает один `useLabelSearch({level:"DAY"})` на view-mount и drillит options + loading state вниз (single source of truth per OQ-A).

## Изменённые/созданные файлы

- `apps/platform/src/modules/plan-detail/components/day-label-select.tsx` (**new**, 65 LOC) — Autocomplete<Label> с slotProps + CircularProgress idiom; options приходят пропом; clear (×) → onChange(null).
- `apps/platform/src/modules/plan-detail/components/day-notes-field.tsx` (**new**, 56 LOC) — TextField multiline с blur-commit; `DAY_CONSTANTS.MAX_NOTES_LENGTH` cap; empty trim → null.
- `apps/platform/src/modules/plan-detail/components/day-row.tsx` (**rewrite**, 49 → 95 LOC) — owns mutations; stacked layout 3 rows; responsive label/notes via `direction={{xs:"column", md:"row"}}`; today-circle сохранён.
- `apps/platform/src/modules/plan-detail/components/week-grid.tsx` (**rewrite**, 17 → 48 LOC) — props extended; zips Mon..Sun `dayOfWeekValues` с `getWeekDays(monday)` через `if (!date) return null;` narrow per `noUncheckedIndexedAccess: true`.
- `apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx` (**modified**, +6 LOC) — добавлен `useLabelSearch({level:"DAY"})` после `useWeek`; WeekGrid invocation расширен 5 пропсами.
- `apps/platform/src/modules/plan-detail/components/index.ts` (**additive**, 4 → 6 экспортов) — `DayLabelSelect` + `DayNotesField` вставлены alphabetic.

**Итого**: 6 файлов (2 новых, 4 modified); ~+170 LOC net. Изменений вне `apps/platform/src/modules/plan-detail/` нет.

## Принятые решения

- **D-1 — TypeScript narrow в WeekGrid через `if (!date) return null;`**: `noUncheckedIndexedAccess: true` делает `dates[idx]: Date | undefined`. Из двух вариантов prompt § 3 Phase 3 — (а) `dayOfWeekValues[idx]!` запрещён `[[type-quality]]`, (б) инверсия итерации — выбрал инверсию: `dayOfWeekValues.map((dayOfWeek, idx) => { const date = dates[idx]; if (!date) return null; ... })`. `dayOfWeek` всегда определён (literal type из `as const` массива). Branch теоретически unreachable (`getWeekDays` всегда возвращает 7 Date'ов), но TS требует narrow без `!`.
- **D-2 — ESLint auto-fix `curly` rule applied**: `pnpm lint --fix` обернул `if (!date) return null;` → `if (!date) {return null;}`. Локальная ESLint конфигурация требует фигурных скобок (rule `curly: all`). Не откатывал — это codebase convention.
- **D-3 — `useLabelSearch` mounted в PlanDetailView с пустым `q`**: per OQ-A ratification A1 — single hook call, options drilled в WeekGrid → DayRow. Все 7 DayRow'в шарят один Label[] список и один `isLoading`; TanStack кэш `["labels","search","DAY",undefined]` валиден через week navigation (не перезапрашивается на `<` `>`).
- **D-4 — DayRow остался `React.FC<Props>`**: соседи (WeekGrid, WeekNotes, WeekNavigator) тоже `React.FC`. Локальная конвенция папки `plan-detail/components/`. DayLabelSelect и DayNotesField — plain arrow (mirror coach-owner precedent § 0.4), но это новые файлы в той же папке; смешанная конвенция OK.
- **D-5 — `disabled={disabled || isLoading}` в DayLabelSelect** (не `=== true`): destruct с дефолтом `disabled = false` гарантирует `boolean` тип; `||` даёт `boolean`. Mirror coach-owner-autocomplete precedent (§ 0.4 line 38).

## Возникшие вопросы и как решены

- Zero § 0 STOP-and-surface escalations. Все verbatim quotes § 0.1-0.7 совпали с HEAD `50d83f66` byte-for-byte (включая 49 LOC day-row.tsx, 17 LOC week-grid.tsx, 68 LOC week-notes.tsx, hooks barrel порядок и husky configs).
- Zero existing UI callsites Step 6.5 hooks подтверждены `grep -rn "useUpdateDayLabel\|useUpdateDayNotes\|useLabelSearch" apps/platform/src/modules/` → 0 hits перед Phase 1.
- `noUncheckedIndexedAccess: true` подтверждён в `packages/typescript-config/base.json:21`; решён через D-1 narrow без `!` per `[[type-quality]]`.

## Что отложено

- **ZWS / control-char normalization на Day notes** — per OQ-C; domain `§1.1` определяет notes как free-text; coach-owned field; ZWS edge редкий. Триггер: если QA репортит «notes pretend to be empty». Реализация: вынести `normalizeText` helper из `label.schema.ts:7` в shared, применить в DayNotesField commit() перед trim.
- **`@repo/ui` LabelSelect extraction** — per OQ-B; first callsite не оправдывает обобщения. Триггер: Step 6.7 SessionLabelSelect показывает ≥ 90% duplication с DayLabelSelect → вынести в `@repo/ui/label-select` с пропсами `value/options/isLoading/onChange/disabled` (текущая поверхность DayLabelSelect — это и есть API).
- **WeekNotes ↔ DayNotesField shared blur-commit primitive** — два callsite'а; DRY преждевременный. Триггер: 3rd surface (BlockNotes? — Step 7 candidate). Тогда: extract `useBlurCommit({ value, onCommit })` hook возвращающий `{ draft, setDraft, handleFocus, handleBlur }` пару.
- **`labelOptions` lazy fetch на Autocomplete open** — Step 6.4 ratified preload server-side. Если через 2-3 weeks coach жалуется на slow first render — перевести `useLabelSearch` на `enabled: false` + lazy trigger из DayLabelSelect через `onOpen`.

## Verification notes

- **`pnpm check-types`** (workspace turbo run): 16/16 successful (platform cache miss, 15 cached). Clean.
- **`pnpm lint`** (workspace turbo run): 16/16 successful (platform cache miss). ESLint `--fix` применил `curly` rule на одну строку week-grid.tsx (D-2).
- **`pnpm dep:check`** (depcruise): ✔ 0 violations, 1146 modules, 2122 dependencies. (Prompt expected 1146-1148; нижняя граница.)
- **`pnpm test`** (workspace turbo run): 7/7 tasks successful, 4m42s total. Сумма по 7 test-package'ам: **929/929 passed** (api-server 552, contracts 196, api-routes 124, query 25, ui 16, auth 14, api-client 2). Planner's «958/958» estimate из § 5.1 был приближённый; актуальная сумма 929 — zero failures, zero deltas от моих UI-only изменений.
- **Grep regressions § 5.2**:

| Check                             | Expected | Actual                      | Status |
| --------------------------------- | -------- | --------------------------- | ------ |
| useUpdateDayLabel/Notes callsites | ≥ 2      | 3 (1 import + 2 hook calls) | ✓      |
| useLabelSearch                    | ≥ 1      | 2 (1 import + 1 hook call)  | ✓      |
| Cross-namespace cms imports       | 0        | 0                           | ✓      |
| Component file count              | 6        | 6                           | ✓      |
| Barrel export count               | 6        | 6                           | ✓      |

## Сценарий смоук-теста

**Preconditions**:

1. `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed` — DB reset to known state.
2. `pnpm dev` (or `pnpm --filter platform dev`) — platform on `http://localhost:3001`.
3. Login as `coach@thedisciplineprogram.com` / `password12345`.
4. Open `/admin` (port 3002), create ≥ 3 labels with `applicableLevels` including `"DAY"`:
   - `REST DAY` (DAY + SESSION + BLOCK)
   - `DELOAD` (DAY only)
   - `TEST WEEK` (DAY only)
5. Pick any seeded TrainingPlan from `/coach/plans`; navigate to `/coach/plans/<planId>?week=<this-monday-YYYY-MM-DD>`.

**Steps**:

1. **Initial render** — 7 DayRows (Mon..Sun). Each shows: weekday-header (e.g. "Mon 19") + today's row with primary-colored circle around date number + empty "Day label" Autocomplete (placeholder "Tag this day…") + empty "Day notes" multiline TextField (placeholder "Notes for this day…") + "No sessions" disabled-text footer.
   _Expected_: zero console errors; `useLabelSearch` fires one `GET /api/platform/labels/search?level=DAY` returning the 3 seeded labels; all 7 Autocompletes share that option list.
2. **Open Monday's label Autocomplete** — click into "Day label" field on Monday's row.
   _Expected_: dropdown shows 3 options sorted alphabetically: `DELOAD`, `REST DAY`, `TEST WEEK`.
3. **Select `REST DAY`** — click the option.
   _Expected_: Autocomplete value updates immediately; toast "Day label saved" appears bottom; Network panel shows `PUT /api/platform/training-plans/.../days/MONDAY/label` body `{"labelId":"<cuid>"}` → 200; followed by `GET /api/platform/training-plans/.../weeks/<monday>` (invalidate-fetch) → Monday row reflects label.
4. **F5 refresh** — full page reload.
   _Expected_: Monday's Autocomplete still shows `REST DAY` (persisted).
5. **Focus Tuesday's notes** — click into "Day notes" TextField on Tuesday's row.
   _Expected_: TextField focus visible; no network activity.
6. **Type `warm-up + 5x5 squats`** in Tuesday's notes (do not blur yet).
   _Expected_: text appears; no network activity (blur-commit pattern).
7. **Blur Tuesday notes** — click outside the field.
   _Expected_: toast "Day notes saved"; `PUT /api/platform/training-plans/.../days/TUESDAY/notes` body `{"notes":"warm-up + 5x5 squats"}` → 200; invalidate-fetch; field still shows trimmed text on next render.
8. **Re-focus Tuesday notes, select-all + Delete, blur** — clear the field.
   _Expected_: toast "Day notes saved"; PUT body `{"notes":null}` → 200; field empty; row stays (breadcrumb per D7).
9. **Click clear (×) on Monday's Autocomplete** — clear the label selection.
   _Expected_: toast "Day label saved"; PUT body `{"labelId":null}` → 200; Autocomplete empty; Monday row stays.
10. **Network kill** — DevTools → Network → Offline.
    Set Wednesday's label to `DELOAD`.
    _Expected_: toast "Failed to save day label"; Autocomplete value temporarily shows `DELOAD` until next invalidate-fetch fails (cache stale; UI may show DELOAD until cache eventually consistent on next successful fetch).
11. **Restore network** — DevTools → Network → Online. Re-select Wednesday label `DELOAD`.
    _Expected_: succeeds; toast "Day label saved"; persists on F5.
12. **Week navigation** — click `>` in WeekNavigator (next week).
    _Expected_: 7 fresh empty rows render; no cached options re-fetch (TanStack stays valid for the `["labels","search","DAY",undefined]` key).
    Click `<` to return.
    _Expected_: Monday `REST DAY` + Wednesday `DELOAD` + Tuesday notes empty (per step 8) — all metadata still showing per the latest invalidations.

**Rollback**: `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed`.

## Acceptance criteria self-check

| Criterion                                              | Status                                                                  |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| § 5.1 commands green (check-types/lint/test/dep:check) | ☑                                                                      |
| § 5.2 grep counts match                                | ☑                                                                      |
| § 5.3 smoke-test 12/12                                 | ☐ user-pending (executor stops here per workflow; user runs in browser) |
| Husky pre-commit clean без --no-verify                 | ☐ pending commit step                                                   |
| output.md sections complete                            | ☑                                                                      |
