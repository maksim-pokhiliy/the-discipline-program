# Step 6.7 — Executor output

**Branch**: `feat/training-domain` (started at `cfa4a792` post-Step-6.6 close-out).
**Commits added**: 5 code + 1 docs (this report).
**HEAD after Phase 8**: `70a84707`.

---

## Что сделано

`apps/platform/src/modules/plan-detail/`: заменил `<Typography>No sessions</Typography>` в `DayRow` на полноценный `SessionList` (drag-handle, label autocomplete, blur-commit notes, kebab-menu Delete с `ConfirmationModal`) + `AddSessionButton`. dnd-kit-sortable обеспечивает оптимистичный reorder внутри Day с rollback на ошибку. Concurrent extracts: `@repo/ui/LabelSelect` (generic Label-Autocomplete) и `@app/lib/hooks/useBlurCommit` (3 callsites — WeekNotes, DayNotesField, новый SessionNotesField). Первая боевая привязка 4 хуков Step 6.5 (`useCreateSession`, `useUpdateSession`, `useDeleteSession`, `useReorderSessions`) и первая установка `@dnd-kit/*` в repo. SESSION-applicable label options поднимаются один раз в `PlanDetailView` через второй `useLabelSearch({ level: "SESSION" })` и проливаются вниз через `WeekGrid → DayRow → SessionList → SessionCard` (4 уровня, в Step 7 5-level триггер → Context).

## Изменённые/созданные файлы

- `pnpm-workspace.yaml` (modified) — добавлены 3 catalog-записи `@dnd-kit/core ^6.3.1`, `@dnd-kit/sortable ^10.0.0`, `@dnd-kit/utilities ^3.2.2` alphabetically между `@commitlint/*` и `@emotion/*`.
- `apps/platform/package.json` (modified) — добавлены 3 deps `@dnd-kit/*: "catalog:"` alphabetically перед `@hookform/resolvers`.
- `pnpm-lock.yaml` (regenerated) — `pnpm install` зафиксировал 4 новых пакета (3 dnd-kit + 1 dep).
- `packages/ui/src/components/label-select/index.tsx` (new) — generic `LabelSelect` Autocomplete<Label> с default `label="Label"`, `placeholder="Select…"`; consumes `@repo/contracts/lms/label`.
- `packages/ui/src/components/index.ts` (modified) — добавлен `export * from "./label-select";` alphabetically между `inline-edit-text` и `layout`.
- `apps/platform/src/lib/hooks/use-blur-commit.ts` (new) — generic `useBlurCommit({ value, onCommit })` → `{ draft, setDraft, handleFocus, handleBlur }`, byte-equivalent поведению pre-Phase-3 WeekNotes/DayNotesField commit blocks.
- `apps/platform/src/lib/hooks/index.ts` (modified) — `export * from "./use-blur-commit";` в начало (alphabetic-leading).
- `apps/platform/src/modules/plan-detail/components/day-label-select.tsx` (rewrite, 69 → 28 LOC) — thin wrapper над `@repo/ui` `LabelSelect` с `label="Day label"`, `placeholder="Tag this day…"`.
- `apps/platform/src/modules/plan-detail/components/day-notes-field.tsx` (rewrite, 62 → 32 LOC) — consume `useBlurCommit`; behaviour-preserving.
- `apps/platform/src/modules/plan-detail/components/week-notes.tsx` (rewrite, 68 → 36 LOC) — consume `useBlurCommit`; `useUpdateWeekNotes.mutate` обёрнут в `onCommit` лямбду.
- `apps/platform/src/modules/plan-detail/components/session-label-select.tsx` (new, 28 LOC) — thin wrapper над `@repo/ui` `LabelSelect` с `label="Session label"`, `placeholder="Tag this session…"`.
- `apps/platform/src/modules/plan-detail/components/session-notes-field.tsx` (new, 32 LOC) — consume `useBlurCommit`; `maxLength={SESSION_CONSTANTS.MAX_NOTES_LENGTH}`.
- `apps/platform/src/modules/plan-detail/components/session-card.tsx` (new, 140 LOC) — single Session row: dnd-kit `useSortable` на drag-handle IconButton (cursor:grab, touchAction:none), `useUpdateSession` для label+notes mutations, kebab `Menu` → `ConfirmationModal` delete; useSortable.disabled при in-flight mutate.
- `apps/platform/src/modules/plan-detail/components/session-list.tsx` (new, 105 LOC) — `DndContext` + `SortableContext` (verticalListSortingStrategy) + `useReorderSessions` с optimistic local `sortedSessions` + rollback на onError + invalidate-resync через `useEffect([sessions])`; пустой список рендерит только `AddSessionButton`.
- `apps/platform/src/modules/plan-detail/components/add-session-button.tsx` (new, 32 LOC) — `useCreateSession.mutate({})` instant-create (server stores `labelId:null, notes:null, order=max+10`).
- `apps/platform/src/modules/plan-detail/components/day-row.tsx` (extend, +20/-5 LOC) — добавлены props `sessions`, `sessionLabelOptions`, `sessionLabelOptionsLoading`; `<Typography>No sessions</Typography>` заменён на `<SessionList>` invocation.
- `apps/platform/src/modules/plan-detail/components/week-grid.tsx` (extend, +6/-0 LOC) — 2 новых props `sessionLabelOptions*` + drill через `sessions: day?.sessions ?? []` в каждый DayRow.
- `apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx` (extend, +5/-1 LOC) — второй `useLabelSearch({ level: "SESSION" })` + drill в WeekGrid.
- `apps/platform/src/modules/plan-detail/components/index.ts` (extend, 6 → 11 exports) — добавлены AddSessionButton, SessionCard, SessionLabelSelect, SessionList, SessionNotesField (alphabetic).
- `implementation/step-06.7/output.md` (new) — этот отчёт.

## Принятые решения

- **D-1 — dnd-kit catalog versions: `@dnd-kit/core ^6.3.1`, `@dnd-kit/sortable ^10.0.0`, `@dnd-kit/utilities ^3.2.2`** — следовал явным версиям из § 3 Phase 1 (не abbreviated `^6/^8/^3` из § 0.10 G1). `pnpm install` ресолвится чисто на React 19 + ESM (+4 packages), 13/13 turbo check-types pass. Никакой adjust-on-fail не понадобился.
- **D-2 — refactor commit subject shortened to 95 chars** — оригинальный `"refactor(platform): adopt labelselect and useblurcommit in week-notes, day-label-select, day-notes-field"` (104 chars) упёрся в commitlint `header-max-length:100`. Переписал в `"refactor(platform): adopt labelselect+useblurcommit in plan-detail components"` (76 chars) — список затронутых файлов перенесён в body. Не `--no-verify`, не amend старых коммитов — фейл commit-msg хука означает что commit не создан, поэтому просто пересоздал.
- **D-3 — SessionCard layout: Menu + ConfirmationModal как siblings внутри dnd Box, не внутри row Stack** — отклонился от черновика в § 3 Phase 6 (там они вложены в `<Stack>`). Привёл к канону `plan-action-menu.tsx` § 0.6, где portal-elements висят siblings к trigger-Stack. Семантически эквивалентно (Menu/Dialog портируются вне DOM-tree), но читается чище и согласуется с существующим паттерном.
- **D-4 — drag handle IconButton: `sx={{ cursor: "grab", touchAction: "none" }}`** — добавил вне явного указания в прототипе, потому что без `touchAction: none` Pointer events на touch-устройствах конфликтуют со scroll-жестом браузера (стандартный dnd-kit gotcha). `cursor: grab` — UX affordance для desktop. Обе настройки идиоматичны и общеприняты в dnd-kit docs.
- **D-5 — lint --fix reordered imports** — eslint автоматически отсортировал импорты в `session-card.tsx` и `session-list.tsx` (`@dnd-kit/*` поднялись над `@mui/*`). Без семантических изменений; принял as-is.
- **D-6 — pnpm test baseline 958/958** — § 5.1 ожидал `929/929`. Дрейф от prompt-write-time (Steps 6.0-6.6 добавили ~29 тестов после оценки в § 5.1). Step 6.7 сам не добавляет тестов (per § 4 explicit OUT), поэтому delta=0 относительно immediate baseline `cfa4a792`. Все 958 зелёные.
- **D-7 — pnpm dep:check 1153 modules vs предсказание [1155-1180]** — 2 модуля ниже нижней границы. 0 violations preserved. Расхождение объясняется тем, что depcruise не считает `node_modules/@dnd-kit/*` (внешние deps, transitive resolution не входит в граф) — баланс между +7 source files и -X off-by-baseline-precision. Critical AC `0 violations` достигнут.

## Возникшие вопросы и как решены

- Zero § 0 STOP-and-surface escalations; все verbatim quotes § 0.1-0.9 совпали byte-for-byte с HEAD `cfa4a792`.
- `BaseModal.title` обязательный prop (read-then-act gate § 10 чек-лист) — добавил `title="Delete session"` в `ConfirmationModal` инвокацию в SessionCard, как и было закодировано в Phase 6 sketch.
- Commitlint header overflow на commit 4 (D-2 выше) — не STOP-and-surface, рутинный fixup без бypass.

## Что отложено

- ZWS strip on Session notes (per OQ-C carry-forward из Step 6.6; Session наследует тот же domain rationale — free-text + coach-owned).
- React Context для label preload (4-level prop drilling acceptable per OQ-C C1; 5-level триггер прилетает в Step 7 с Block surface).
- Optimistic updates для label/notes mutations (per Step 6.5 OQ-D — invalidate-only; revisit если UX surfaces flicker).
- WeekNotes client maxLength cap (Step 5 QA-005 deferred; не в Step 6.7 scope per § 4).
- Cross-day Session drag (out per Step 6.1 design — reorder day-scoped).
- `@repo/ui` `LabelSelect` props для `size` / `variant` override (currently hardcoded `size="small" variant="outlined"`; extend на Step 7 BlockLabelSelect, если понадобится).
- Tests для новых компонентов (UI-layer; mirror Step 5 + 6.5 + 6.6 no-test precedent; coverage via § 5.3 13-step smoke).

## Verification notes

| Команда                                       | Результат                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| `pnpm install`                                | OK (+4 packages: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities + 1 transient) |
| `pnpm check-types` (через turbo, 16 packages) | 16/16 pass                                                                           |
| `pnpm lint` (через turbo, 16 packages)        | 16/16 pass                                                                           |
| `pnpm test` (105 файлов)                      | 958/958 pass (D-6 выше)                                                              |
| `pnpm dep:check`                              | 0 violations / 1153 modules / 2138 dependencies (D-7 выше)                           |

### § 5.2 Grep regressions

| Grep                                                                                                      | Expected | Actual |
| --------------------------------------------------------------------------------------------------------- | -------- | ------ |
| `useCreateSession\|useUpdateSession\|useDeleteSession\|useReorderSessions` в `apps/platform/src/modules/` | ≥ 4      | 7 ✓    |
| `@dnd-kit/` в `apps/platform/src/`                                                                        | ≥ 2      | 4 ✓    |
| `useBlurCommit` в `apps/platform/src/`                                                                    | ≥ 4      | 7 ✓    |
| `LabelSelect` в `packages/ui/src/ apps/platform/src/`                                                     | ≥ 4      | 19 ✓   |
| Component file count `apps/platform/src/modules/plan-detail/components/*.tsx`                             | 11       | 11 ✓   |
| Cross-namespace regression `@repo/contracts/cms/\|@repo/api-server/cms` в `plan-detail/`                  | 0        | 0 ✓    |

### Husky gate per-commit (per § 0.8 + § 7)

| Commit     | Subject                                                                         | Husky pre-commit                                                              | Notes                                                 |
| ---------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------- |
| `2ab958ea` | `chore(platform): add dnd-kit deps for session reorder`                         | pass (13/13 check-types)                                                      | Phase 1, single-package + lockfile, no code uses deps |
| `9425dda2` | `feat(ui): add generic labelselect autocomplete component`                      | pass (16/16 check-types across platform/admin/marketing/storybook + @repo/ui) | Phase 2, cross-package additive                       |
| `ff931fc6` | `feat(platform): add useblurcommit hook for shared blur-commit text fields`     | pass (13/13 check-types)                                                      | Phase 3, single-package, callsites untouched          |
| `3896e922` | `refactor(platform): adopt labelselect+useblurcommit in plan-detail components` | pass (13/13 check-types) после D-2 fixup                                      | Phase 4                                               |
| `70a84707` | `feat(platform): add session body with sessioncard list and dnd-kit reorder`    | pass (13/13 check-types)                                                      | Phases 5+6+7+8 atomically                             |

Всё чисто без `--no-verify`, `--no-edit`, `--no-gpg-sign`.

## Сценарий смоук-теста

(verbatim из § 5.3)

### Preconditions

1. `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed`.
2. `pnpm dev` (или `pnpm --filter platform dev`) — platform на port 3001.
3. Login как `coach@thedisciplineprogram.com` / `password12345`.
4. Open `/admin` (port 3002), create 3 labels:
   - `1ST SESSION` (`applicableLevels=[SESSION]`)
   - `EASY PACE` (`applicableLevels=[SESSION, BLOCK]`)
   - `REST DAY` (`applicableLevels=[DAY]`)
5. From `/coach/plans`, pick any seeded plan; navigate to `/coach/plans/<planId>?week=<this-monday>`.

### Steps (must-pass 1-13)

1. **Initial render**. Each DayRow under metadata header shows "+ Add session" outlined button + zero SessionCards (нет больше `<Typography>No sessions</Typography>`). DevTools Network: `useLabelSearch({level:"SESSION"})` fires 1 GET `/api/platform/labels/search?level=SESSION` returning 2 SESSION-applicable labels.
2. **Click "+ Add session" on Monday**. POST `/api/platform/training-plans/.../days/MONDAY/sessions` body `{}` → 200 → toast "Session created" → empty SessionCard appears with drag-handle (left), empty "Session label" Autocomplete, empty multiline "Session notes" field, kebab menu (right).
3. **Open Monday SessionCard's label Autocomplete**. Dropdown shows 2 SESSION labels sorted alphabetically: `1ST SESSION`, `EASY PACE`. `REST DAY` (DAY-only) is absent.
4. **Select `1ST SESSION`**. Autocomplete updates immediately; toast "Session updated"; PUT `/api/platform/training-plans/.../sessions/<sid>` body `{"labelId":"<cuid>"}` → 200; invalidate-fetch → chip renders.
5. **Focus Monday SessionCard notes, type `snatch 5x3 + clean 5x3`, blur**. Toast "Session updated"; PUT body `{"notes":"snatch 5x3 + clean 5x3"}` → 200.
6. **F5 refresh**. Monday SessionCard persists with label + notes.
7. **Click "+ Add session" on Monday again**. 2nd empty SessionCard appears below 1st.
8. **Drag 2nd card by its drag-handle above the 1st card, drop**. Visual order swaps immediately (optimistic local state). PUT `.../sessions/reorder` body `{"orderedIds":["<id2>","<id1>"]}` → 200 → toast "Sessions reordered".
9. **F5**. Order persists from server-authoritative response.
10. **Click trailing kebab on top SessionCard → Delete**. ConfirmationModal opens with message "Delete this session?" + details `1ST SESSION` (or `Empty session` if label cleared) + red "Delete" button + "Cancel".
11. **Click "Delete" in modal**. DELETE `.../sessions/<sid>` → 200 → toast "Session deleted" → modal closes → card removed → только 1 SessionCard остаётся.
12. **DevTools offline → change label on remaining SessionCard**. Toast "Failed to update session"; Autocomplete value reverts to previous label on next invalidate cycle (cache stays consistent with server).
13. **Restore network online**. Retry the label change → succeeds; persists on F5.

### Nice-to-have (14-15)

14. **Open second tab to same URL, delete the remaining SessionCard there. Return to tab 1. Drag attempt on the (stale) card** → server 404 NotFoundError → toast "Failed to reorder sessions" → invalidate → SessionList empties.
15. **Week navigation `>` then `<`**. Other weeks show empty SessionLists. Return to original → state per latest invalidate. No cached SESSION-label refetch (TanStack cache key `["labels","search","SESSION",undefined]` stable).

**Rollback**: `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed`.

## Acceptance criteria self-check

| Criterion                                                          | Status         |
| ------------------------------------------------------------------ | -------------- |
| § 5.1 commands green (install, check-types, lint, test, dep:check) | ☑             |
| § 5.2 grep counts match                                            | ☑             |
| § 5.3 smoke-test 13/13                                             | ☐ user-pending |
| Husky pre-commit + pre-push clean без `--no-verify`                | ☑             |
| `output.md` sections complete                                      | ☑             |
