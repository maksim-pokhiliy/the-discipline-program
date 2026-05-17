# Step 6.6 — DayRow header reshape: Day label autocomplete + Day notes field

**Branch**: `feat/training-domain` (HEAD `50d83f66`, recreated locally from fresh `main` post-PR-#193 merge).
**Type**: UI-only step (apps/platform), first UI surface since Step 5 plan-detail shell.
**Scope**: reshape `apps/platform/src/modules/plan-detail/components/day-row.tsx` from plain "weekday-name + 'No sessions'" into the first production consumer of Step-6.5 hooks: `useUpdateDayLabel` / `useUpdateDayNotes` / `useLabelSearch`. Sessions area stays placeholder — Session CRUD is Step 6.7.
**Execution mode**: direct prompt execution (no `/feature small` wrapper) per Step 6.4.5 D-1 precedent — self-contained brief; `/feature small` would re-derive and try to cut a fresh branch.

---

## § 0. Hard triggers — read-then-act gate

Before touching any code, verify every verbatim quote below against the actual file at HEAD (`50d83f66`) byte-for-byte. If ANY quote diverges, STOP, run `AskUserQuestion` showing the actual content + the prompt's claim, wait for planner ratification. Do NOT silently adapt.

This step is the **first UI consumer** of Step 6.5 hooks. By `[[planner-consumer-pattern-read]]` zero-state convention, you must also re-verify zero existing UI callsites at start:

```bash
grep -rn "useUpdateDayLabel\|useUpdateDayNotes\|useLabelSearch" apps/platform/src/modules/
# Expected: 0 hits. If non-zero, STOP and surface.
```

### § 0.1 Existing surface — `apps/platform/src/modules/plan-detail/`

Read verbatim before reshape:

#### `components/day-row.tsx` (49 LOC, current)

```tsx
import { Box, Stack, Typography } from "@mui/material";

import { formatDayName, isSameDay } from "@repo/shared";

type DayRowProps = {
  date: Date;
};

export const DayRow: React.FC<DayRowProps> = ({ date }) => {
  const isToday = isSameDay(date, new Date());
  const dayOfMonth = date.getDate();

  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="flex-start"
      sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ width: 72, flexShrink: 0 }}>
        <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
          {formatDayName(date)}
        </Typography>
        {isToday ? (
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="subtitle2">{dayOfMonth}</Typography>
          </Box>
        ) : (
          <Typography variant="subtitle2">{dayOfMonth}</Typography>
        )}
      </Stack>

      <Typography variant="body2" sx={{ color: "text.disabled", flex: 1 }}>
        No sessions
      </Typography>
    </Stack>
  );
};
```

#### `components/week-grid.tsx` (17 LOC, current)

```tsx
import { Stack } from "@mui/material";

import { formatDateParam, getWeekDays } from "@repo/shared";

import { DayRow } from "./day-row";

type WeekGridProps = {
  monday: Date;
};

export const WeekGrid: React.FC<WeekGridProps> = ({ monday }) => (
  <Stack sx={{ borderTop: 1, borderColor: "divider" }}>
    {getWeekDays(monday).map((date) => (
      <DayRow key={formatDateParam(date)} date={date} />
    ))}
  </Stack>
);
```

#### `components/week-notes.tsx` (68 LOC, canonical blur-commit precedent — DO NOT modify; mirror in DayNotesField)

Critical block — lines 30-47, `commit()` invariant:

```tsx
const commit = () => {
  isFocusedRef.current = false;

  const trimmed = draft.trim();

  if (trimmed === committedRef.current) {
    setDraft(committedRef.current);

    return;
  }

  committedRef.current = trimmed;
  setDraft(trimmed);
  updateNotes.mutate({
    startDate: formatDateParam(monday),
    data: { notes: trimmed === "" ? null : trimmed },
  });
};
```

Full file at `apps/platform/src/modules/plan-detail/components/week-notes.tsx:1-68`. Read fully before writing DayNotesField; mirror the `useEffect`-sync-when-unfocused + `committedRef` + `isFocusedRef` invariant verbatim.

#### `views/plan-detail-view.tsx` (66 LOC, current — Stack composition block)

Lines 35-65:

```tsx
return (
  <QueryWrapper isLoading={isLoading} error={error} data={plan} loadingMessage="Loading plan...">
    {(plan) => (
      <Stack spacing={4}>
        <PageHeader
          editable
          title={plan.name}
          {...(plan.description !== null && { description: plan.description })}
          backHref="/coach/plans"
          actions={<PlanStatusChip status={plan.status} />}
          onTitleCommit={(next) => updatePlan.mutate({ id: planId, data: { name: next } })}
          onDescriptionCommit={(next) =>
            updatePlan.mutate({
              id: planId,
              data: { description: next === "" ? null : next },
            })
          }
        />

        <WeekNavigator monday={activeMonday} onChange={pushWeekParam} />
        <WeekNotes
          key={formatDateParam(activeMonday)}
          planId={planId}
          monday={activeMonday}
          notes={weekData?.week?.notes ?? null}
        />
        <WeekGrid monday={activeMonday} />
      </Stack>
    )}
  </QueryWrapper>
);
```

Note: `weekData` from `useWeek(planId, formatDateParam(activeMonday))` (line 25) currently has `weekData?.week?.notes` consumed but `weekData?.days` ignored. Step 6.6 starts consuming `days` (`DaySlot[]`) via WeekGrid.

### § 0.2 Step 6.5 hooks (read-only, do not modify)

#### `apps/platform/src/lib/hooks/use-day-metadata.ts` (26 LOC)

```ts
"use client";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type { DaySlot, UpdateDayLabelData, UpdateDayNotesData } from "@repo/contracts/lms/day";

import { api } from "../api";

import { useWeekMutation } from "./use-week-mutation";

export const useUpdateDayLabel = (planId: string, startDate: string, dayOfWeek: DayOfWeek) =>
  useWeekMutation<UpdateDayLabelData, DaySlot>({
    mutationFn: (data) => api.dayMetadata.setLabel(planId, startDate, dayOfWeek, data),
    planId,
    startDate,
    successMessage: "Day label saved",
    errorMessage: "Failed to save day label",
  });

export const useUpdateDayNotes = (planId: string, startDate: string, dayOfWeek: DayOfWeek) =>
  useWeekMutation<UpdateDayNotesData, DaySlot>({
    mutationFn: (data) => api.dayMetadata.setNotes(planId, startDate, dayOfWeek, data),
    planId,
    startDate,
    successMessage: "Day notes saved",
    errorMessage: "Failed to save day notes",
  });
```

#### `apps/platform/src/lib/hooks/use-label-search.ts` (28 LOC)

```ts
"use client";

import { useQuery } from "@tanstack/react-query";

import type { AppLevelValue, Label, LabelSearchParams } from "@repo/contracts/lms/label";

import { api } from "../api";
import { platformKeys } from "../api/keys";

type UseLabelSearchArgs = {
  level?: AppLevelValue;
  q?: string;
  enabled?: boolean;
};

export const useLabelSearch = ({ level, q, enabled = true }: UseLabelSearchArgs = {}) =>
  useQuery<Label[]>({
    queryKey: platformKeys.labels.search(level, q),
    queryFn: () => {
      const params: LabelSearchParams = {
        ...(level !== undefined && { level }),
        ...(q !== undefined && { q }),
      };

      return api.labels.search(Object.keys(params).length > 0 ? params : undefined);
    },
    enabled,
  });
```

#### `apps/platform/src/lib/hooks/use-week-mutation.ts` (39 LOC)

```ts
"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";

import { notifyError } from "@repo/query";

import { platformKeys } from "../api/keys";

type UseWeekMutationConfig<TVars, TResult> = {
  mutationFn: (vars: TVars) => Promise<TResult>;
  planId: string;
  startDate: string;
  successMessage: string;
  errorMessage: string;
};

export const useWeekMutation = <TVars, TResult>({
  mutationFn,
  planId,
  startDate,
  successMessage,
  errorMessage,
}: UseWeekMutationConfig<TVars, TResult>): UseMutationResult<TResult, Error, TVars> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.weeks.byDate(planId, startDate),
      });
      toast.success(successMessage);
    },
    onError: (error: Error) => {
      notifyError(error, errorMessage);
    },
  });
};
```

### § 0.3 Contracts (read-only, do not modify)

#### `packages/contracts/src/entities/lms/day/day.schema.ts` (26 LOC)

```ts
import { z } from "zod";

import { dayOfWeekSchema } from "../_shared";
import { labelSchema } from "../label";
import { sessionSchema } from "../session";

import { DAY_CONSTANTS } from "./day.constants";

export const sessionWithLabelSchema = sessionSchema.extend({
  label: labelSchema.nullable(),
});

export const daySlotSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  label: labelSchema.nullable(),
  notes: z.string().nullable(),
  sessions: z.array(sessionWithLabelSchema),
});

export const updateDayLabelSchema = z.object({
  labelId: z.string().cuid().nullable(),
});

export const updateDayNotesSchema = z.object({
  notes: z.string().max(DAY_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
});
```

#### `packages/contracts/src/entities/lms/day/day.constants.ts` (3 LOC)

```ts
export const DAY_CONSTANTS = {
  MAX_NOTES_LENGTH: 2000,
} as const;
```

#### `packages/contracts/src/entities/lms/_shared/day-of-week.ts` (15 LOC)

```ts
import { z } from "zod";

export const dayOfWeekValues = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export const dayOfWeekSchema = z.enum(dayOfWeekValues);

export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;
```

Order in `dayOfWeekValues` = Mon..Sun (matches `getWeekDays(monday): Date[]` from `@repo/shared` which returns `[Mon, Tue, ..., Sun]`).

#### `packages/contracts/src/entities/lms/label/label.constants.ts` (7 LOC, relevant excerpt)

```ts
export const APP_LEVELS = ["DAY", "SESSION", "BLOCK"] as const;
export type AppLevelValue = (typeof APP_LEVELS)[number];
```

Use `AppLevelValue` "DAY" as the level constant in `useLabelSearch({ level: "DAY" })`.

#### `packages/contracts/src/entities/lms/label/label.schema.ts` (relevant excerpt — Label shape)

```ts
export const labelSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(LABEL_CONSTANTS.MAX_NAME_LENGTH),
  nameLower: z.string(),
  applicableLevels: applicableLevelsSchema,
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

`Label` type from `@repo/contracts/lms/label`. Use `option.name` for `getOptionLabel`; `option.id === value.id` for `isOptionEqualToValue`.

### § 0.4 Canonical Autocomplete precedent

#### `apps/admin/src/lib/components/coach-owner-autocomplete/index.tsx` (79 LOC — full file)

```tsx
"use client";

import { Autocomplete, CircularProgress, TextField } from "@mui/material";

import { type CoachListItem } from "@repo/contracts/iam/user";

import { useCoachesList } from "@app/lib/hooks";

type CoachOwnerAutocompleteProps = {
  value: string | null;
  onChange: (userId: string | null) => void;
  disabled?: boolean | undefined;
  error?: boolean | undefined;
  helperText?: string | undefined;
  label?: string | undefined;
};

const getOptionLabel = (option: CoachListItem) => option.name ?? option.email;

export const CoachOwnerAutocomplete = ({
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
  label = "New owner",
}: CoachOwnerAutocompleteProps) => {
  const { data: coaches = [], isLoading } = useCoachesList();
  const selected = coaches.find((c) => c.userId === value) ?? null;

  return (
    <Autocomplete<CoachListItem>
      options={coaches}
      value={selected}
      onChange={(_, next) => onChange(next?.userId ?? null)}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, val) => option.userId === val.userId}
      disabled={disabled || isLoading}
      renderInput={(params) => {
        const {
          size: paramsSize,
          disabled: paramsDisabled,
          fullWidth: paramsFullWidth,
          id: paramsId,
          InputLabelProps,
          inputProps,
          InputProps,
        } = params;

        return (
          <TextField
            {...(paramsSize !== undefined && { size: paramsSize })}
            {...(paramsDisabled !== undefined && { disabled: paramsDisabled })}
            {...(paramsFullWidth !== undefined && { fullWidth: paramsFullWidth })}
            {...(paramsId !== undefined && { id: paramsId })}
            inputProps={inputProps}
            label={label}
            variant="outlined"
            error={error}
            {...(helperText !== undefined && { helperText })}
            slotProps={{
              inputLabel: InputLabelProps,
              input: {
                ...InputProps,
                endAdornment: (
                  <>
                    {isLoading ? <CircularProgress color="inherit" size={16} /> : null}
                    {InputProps.endAdornment}
                  </>
                ),
              },
            }}
          />
        );
      }}
    />
  );
};
```

Differences for `DayLabelSelect` from this precedent:

- **Options sourced from prop**, not own hook (per OQ-A ratification A1 — preload в PlanDetailView, drill down). Props `options: Label[]` + `isLoading: boolean`.
- **Value sourced from prop** as `Label | null` (already resolved upstream), not `string | null` (no need for `coaches.find((c) => c.userId === value)` lookup).
- **`onChange` passes `labelId: string | null`** to upstream (DayRow translates to `mutate({ labelId })`).
- **`getOptionLabel = (o: Label) => o.name`** — `Label.name` is always non-null.
- **`isOptionEqualToValue = (option, val) => option.id === val.id`**.

Match the slotProps idiom, `paramsSize/paramsDisabled/paramsFullWidth/paramsId` conditional-spread, and `CircularProgress endAdornment` while loading — required by `exactOptionalPropertyTypes: true` (`packages/typescript-config/base.json:10`).

### § 0.5 Registration files (additive intent — quote current state, show final state in full)

#### `apps/platform/src/modules/plan-detail/components/index.ts` (4 LOC, current)

```ts
export { DayRow } from "./day-row";
export { WeekGrid } from "./week-grid";
export { WeekNavigator } from "./week-navigator";
export { WeekNotes } from "./week-notes";
```

**Final state (additive, alphabetic by export name)** — add `DayLabelSelect`, `DayNotesField`:

```ts
export { DayLabelSelect } from "./day-label-select";
export { DayNotesField } from "./day-notes-field";
export { DayRow } from "./day-row";
export { WeekGrid } from "./week-grid";
export { WeekNavigator } from "./week-navigator";
export { WeekNotes } from "./week-notes";
```

#### `apps/platform/src/lib/hooks/index.ts` (12 LOC, current — DO NOT modify; hooks already exported by Step 6.5)

```ts
export * from "./use-coach-athletes";
export * from "./use-current-user-role";
export * from "./use-coach-action-items";
export * from "./use-coach-dashboard";
export * from "./use-coach-invite";
export * from "./use-day-metadata";
export * from "./use-label-search";
export * from "./use-sessions";
export * from "./use-training-plans";
export * from "./use-users";
export * from "./use-week-mutation";
export * from "./use-weeks";
```

Step 6.6 imports via `@app/lib/hooks` barrel (lines 6, 7 already present).

#### `apps/platform/src/lib/api/endpoints/index.ts` (10 LOC, current — DO NOT modify; Step 6.5 already wired)

```ts
export { createCoachAthletesAPI } from "./coach-athletes";
export { createCoachActionItemsAPI } from "./coach-action-items";
export { createCoachDashboardAPI } from "./coach-dashboard";
export { createCoachInviteAPI } from "./coach-invite";
export { createDayMetadataAPI } from "./day-metadata";
export { createLabelsAPI } from "./labels";
export { createSessionsAPI } from "./sessions";
export { createTrainingPlansAPI } from "./training-plans";
export { createUsersAPI } from "./users";
export { createWeeksAPI } from "./weeks";
```

### § 0.6 Husky hooks (commit-strategy gate, per `[[husky-cross-package-squash]]`)

#### `.husky/pre-commit`

```
node scripts/check-secrets.mjs
npx lint-staged
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"
```

#### `.husky/pre-push`

```
pnpm dep:check
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"
```

**All Step 6.6 changes are in a single package (`apps/platform`)** — no cross-package broken-import intermediate state possible. Single atomic commit OK; no squash required. Pre-commit gate scoped to `apps/platform` will type-check on its own.

### § 0.7 Domain citations (per `[[coach-pov-first]]`)

#### `analysis/artifacts/05-synthesis/domain-model.md §1.1 — Day` (lines 79-103, verbatim)

```
**Purpose**: контейнер sessions для одного weekday в рамках одной `Week`. После D1 (2026-05-12) Day напрямую связан с календарной осью через `weekId` + `dayOfWeek`.

**Attributes** (post D1):
- `id` — identity.
- `weekId` — FK на `Week`.
- `dayOfWeek` — enum `DayOfWeek { MONDAY..SUNDAY }`.
- `label` — optional single LabelRef.
- `notes` — optional free-text.
- `sessions` — ordered children, 0..N (по `Session.order`).

**Invariants**:
- `(weekId, dayOfWeek)` unique — один Day на weekday на Week (≤7 Days per Week).
- `sessions.length === 0` валидно (REST DAY: 66 occurrences в sample).
- Single label (sample evidence: только `R E S T  D A Y`, всегда один).
- Календарная дата конкретного Day = `week.startDate + offset(dayOfWeek)` — derived, не stored.

**Sample evidence**: 1 label (`REST DAY`), 66 occurrences. Active days (5/7) — без label.
```

Coach mental model: **single label per Day**, free-text notes, sessions ordered list. Cleared label/notes = breadcrumb (D7 — Day row stays in DB, UI just shows null/empty).

#### `analysis/artifacts/05-synthesis/domain-model.md §1.8 — Label` (relevant invariants, lines 325-349)

`applicable_levels` = advisory hint (non-empty set из `{day, session, block}`). Day-level filter at the UI layer is the explicit Step-6.6 use case. Sample: 1 day-label total (`REST DAY`).

### § 0.8 Resolved planner decisions for Step 6.6

| OQ                                | Resolution                                                       | Rationale                                                                                                                           |
| --------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **A** (`useLabelSearch` location) | A1 — PlanDetailView (1 call, drill down)                         | Single source of truth, clean DevTools, explicit data-flow. Prop-drilling 2 levels (PlanDetailView → WeekGrid → DayRow) acceptable. |
| **B** (Autocomplete shape)        | B1 — local `plan-detail/components/day-label-select.tsx`         | No `@repo/ui` extraction at 1st callsite. Revisit if Step 6.7 SessionLabelSelect shows 90%+ duplication.                            |
| **C** (ZWS strip in notes)        | C1 — skip Step 6.6, deferred follow-up                           | Domain `§1.1` is "free-text"; no normalize requirement; coach own field; ZWS edge. Document in output.md "Что отложено".            |
| **D** (DayRow layout)             | D1 — responsive `direction={{xs:"column", md:"row"}}`            | Coach primary laptop; narrow viewport rare but layout shouldn't break.                                                              |
| **E** (label sort)                | E1 — server-sorted `nameLower asc` (Step 6.3), no client re-sort | ~3-5 day-labels typical (analysis sample); recency-bias gain marginal.                                                              |

### § 0.9 STOP-and-surface protocol

If during Phase 1-4 you find:

- Verbatim quote in § 0.1-0.7 diverges from actual HEAD file byte-for-byte.
- `useLabelSearch` / `useUpdateDayLabel` / `useUpdateDayNotes` signature drift (Step 6.5 was just shipped; should be byte-identical).
- `daySlotSchema` / `dayOfWeekValues` / `Label` shape drift.
- A consumer site for these hooks already exists in `apps/platform/src/modules/` (would mean Step 6.6 was partially done earlier).
- An unrelated planner-discipline miss (e.g. § 3 implies a contract change — IT SHOULD NOT; Step 6.6 is pure UI).

STOP. Run `AskUserQuestion` showing the divergence and your hypothesis. Wait for planner ratification. Per `[[coach-pov-first]]` + `[[planner-verbatim-registration]]` + `[[planner-consumer-pattern-read]]` — never silently adapt.

---

## § 1. Goal

Превратить `apps/platform/src/modules/plan-detail/components/day-row.tsx` из плоского weekday-name + "No sessions" stub'а в первое production UI surface для Day-level metadata:

1. **Day label**: MUI `Autocomplete<Label>` над библиотекой Labels с `applicableLevels.includes("DAY")`. Coach выбирает one label per Day (per `domain-model.md §1.1` invariant "single label"); clear (×) → `mutate({ labelId: null })`. Per D7 — row остаётся (breadcrumb).
2. **Day notes**: multiline `TextField` (min 2 rows), blur-commit zеркало WeekNotes pattern. Empty trim → `mutate({ notes: null })`. Max 2000 chars (DAY_CONSTANTS).

Both surfaces — первые production callsites хуков Step 6.5 (`useUpdateDayLabel` / `useUpdateDayNotes` / `useLabelSearch`). Sessions area остаётся "No sessions" placeholder — Session CRUD ratified в Step 6.7.

---

## § 2. Context — decision lineage

- **D1** (2026-05-12) — `Day { dayOfWeek DayOfWeek, labelId?, notes?, weekId }` with `(weekId, dayOfWeek)` unique. Single label per Day.
- **D6** (2026-05-14) — Week is a lazy calendar slot.
- **D7** (2026-05-15) — Day is a lazy calendar slot (mirror of D6). No add/remove/reorder UX. Cleared label/notes/sessions = breadcrumb. API returns `daySlot` shape with `null` fields, never 404.
- **D8** (2026-05-15) — `Label` lives in `lms/*` namespace.
- **Step 6.2** (2026-05-16) — `getWeekResponseSchema` returns `{ week, days: DaySlot[7] }`. UI consumes `weekData.days[i]` directly; no materialization branching.
- **Step 6.5** (2026-05-16) — `useUpdateDayLabel` / `useUpdateDayNotes` / `useLabelSearch` shipped; first production callsite is this step.
- **Step 6.4** (2026-05-16, ratified mid-thesis) — label preload UX: coach opens label-select form → applicable-level-filtered labels preloaded server-side (NOT lazy on autocomplete open).
- **OQ resolutions** (§ 0.8): A1 / B1 / C1 / D1 / E1.

Out of scope (handled later):

- Session-level surface (label, notes, ordering) — **Step 6.7**.
- "Add session" CTA — Step 6.7.
- `@dnd-kit` reorder — Step 6.7.
- Day auto-cleanup on empty — explicit out per D7.
- ZWS strip on notes — deferred per OQ-C.
- `@repo/ui` LabelSelect extraction — deferred per OQ-B; reconsider Step 6.7 if duplication ≥ 90%.

---

## § 3. Implementation phases

Order chosen to keep `pnpm --filter platform check-types` green between each file save (no broken-intermediate state at husky pre-commit gate).

### Phase 1 — `DayLabelSelect` component (new file)

**File**: `apps/platform/src/modules/plan-detail/components/day-label-select.tsx`

**Props**:

```ts
type DayLabelSelectProps = {
  value: Label | null;
  options: Label[];
  isLoading: boolean;
  onChange: (labelId: string | null) => void;
  disabled?: boolean | undefined;
};
```

**Imports**:

```ts
"use client";

import { Autocomplete, CircularProgress, TextField } from "@mui/material";

import type { Label } from "@repo/contracts/lms/label";
```

**Body** — pattern-mirror `coach-owner-autocomplete.tsx` (§ 0.4) slotProps + CircularProgress idiom. Differences from precedent:

- `options` from prop, not own hook (per A1).
- `value` from prop as `Label | null` directly (no `find` lookup).
- `getOptionLabel = (o: Label) => o.name`.
- `isOptionEqualToValue = (option, val) => option.id === val.id`.
- `onChange={(_, next) => onChange(next?.id ?? null)}`.
- TextField `label="Day label"`, `size="small"`, `placeholder="Tag this day…"`.
- `disabled={disabled === true || isLoading}` (conditional-spread inside Autocomplete props).
- No `error` / `helperText` props (mutation errors surface via toast, not inline — mirror WeekNotes pattern).

**Sample skeleton** (adapt — do NOT copy verbatim if `exactOptionalPropertyTypes` complains; mirror coach-owner precedent's conditional-spread):

```tsx
"use client";

import { Autocomplete, CircularProgress, TextField } from "@mui/material";

import type { Label } from "@repo/contracts/lms/label";

type DayLabelSelectProps = {
  value: Label | null;
  options: Label[];
  isLoading: boolean;
  onChange: (labelId: string | null) => void;
  disabled?: boolean | undefined;
};

const getOptionLabel = (option: Label) => option.name;

export const DayLabelSelect = ({
  value,
  options,
  isLoading,
  onChange,
  disabled = false,
}: DayLabelSelectProps) => (
  <Autocomplete<Label>
    options={options}
    value={value}
    onChange={(_, next) => onChange(next?.id ?? null)}
    getOptionLabel={getOptionLabel}
    isOptionEqualToValue={(option, val) => option.id === val.id}
    disabled={disabled || isLoading}
    size="small"
    renderInput={(params) => {
      const {
        size: paramsSize,
        disabled: paramsDisabled,
        fullWidth: paramsFullWidth,
        id: paramsId,
        InputLabelProps,
        inputProps,
        InputProps,
      } = params;

      return (
        <TextField
          {...(paramsSize !== undefined && { size: paramsSize })}
          {...(paramsDisabled !== undefined && { disabled: paramsDisabled })}
          {...(paramsFullWidth !== undefined && { fullWidth: paramsFullWidth })}
          {...(paramsId !== undefined && { id: paramsId })}
          inputProps={inputProps}
          label="Day label"
          placeholder="Tag this day…"
          variant="outlined"
          slotProps={{
            inputLabel: InputLabelProps,
            input: {
              ...InputProps,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress color="inherit" size={16} /> : null}
                  {InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      );
    }}
  />
);
```

If TS errors surface on `slotProps` shape under MUI 7 typings — adapt minimally; do NOT introduce `as any` / `as unknown` / non-null assertions per `[[type-quality]]`. If a real type-system blocker emerges, surface via `AskUserQuestion` with the exact compiler error.

### Phase 2 — `DayNotesField` component (new file)

**File**: `apps/platform/src/modules/plan-detail/components/day-notes-field.tsx`

**Props**:

```ts
type DayNotesFieldProps = {
  value: string | null;
  onCommit: (next: string | null) => void;
};
```

**Imports**:

```ts
"use client";

import { useEffect, useRef, useState } from "react";

import { TextField } from "@mui/material";

import { DAY_CONSTANTS } from "@repo/contracts/lms/day";
```

**Body** — verbatim mirror of `week-notes.tsx` commit-pattern (§ 0.1, lines 17-67), with three differences:

1. `useUpdateWeekNotes` → external `onCommit` prop. Mutation lives in parent (DayRow); this component is presentational.
2. `mutate({ startDate: formatDateParam(monday), data: { notes: trimmed === "" ? null : trimmed } })` → `onCommit(trimmed === "" ? null : trimmed)`.
3. `inputProps={{ maxLength: DAY_CONSTANTS.MAX_NOTES_LENGTH }}` (client-cap; closes Step 5 QA-005 deferred for this surface).
4. `label="Day notes"`, `placeholder="Notes for this day…"`.

**Skeleton** (mirror week-notes.tsx; adapt for `onCommit` prop):

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

import { TextField } from "@mui/material";

import { DAY_CONSTANTS } from "@repo/contracts/lms/day";

type DayNotesFieldProps = {
  value: string | null;
  onCommit: (next: string | null) => void;
};

export const DayNotesField = ({ value, onCommit }: DayNotesFieldProps) => {
  const [draft, setDraft] = useState(value ?? "");
  const committedRef = useRef(value ?? "");
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(value ?? "");
      committedRef.current = value ?? "";
    }
  }, [value]);

  const commit = () => {
    isFocusedRef.current = false;

    const trimmed = draft.trim();

    if (trimmed === committedRef.current) {
      setDraft(committedRef.current);

      return;
    }

    committedRef.current = trimmed;
    setDraft(trimmed);
    onCommit(trimmed === "" ? null : trimmed);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    committedRef.current = value ?? "";
  };

  return (
    <TextField
      label="Day notes"
      placeholder="Notes for this day…"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={handleFocus}
      onBlur={commit}
      multiline
      minRows={2}
      fullWidth
      size="small"
      inputProps={{ maxLength: DAY_CONSTANTS.MAX_NOTES_LENGTH }}
    />
  );
};
```

### Phase 3 — `DayRow` reshape + `WeekGrid` signature extension

**File**: `apps/platform/src/modules/plan-detail/components/day-row.tsx`

**New props**:

```ts
type DayRowProps = {
  date: Date;
  planId: string;
  startDate: string;
  dayOfWeek: DayOfWeek;
  label: Label | null;
  notes: string | null;
  labelOptions: Label[];
  labelOptionsLoading: boolean;
};
```

**Imports**:

```ts
"use client";

import { Box, Stack, Typography } from "@mui/material";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type { Label } from "@repo/contracts/lms/label";
import { formatDayName, isSameDay } from "@repo/shared";

import { useUpdateDayLabel, useUpdateDayNotes } from "@app/lib/hooks";

import { DayLabelSelect } from "./day-label-select";
import { DayNotesField } from "./day-notes-field";
```

**Body**:

- Add `"use client"` directive (previously absent — DayRow was server-renderable; now it owns mutation state).
- Instantiate `const updateLabel = useUpdateDayLabel(planId, startDate, dayOfWeek);`
- `const updateNotes = useUpdateDayNotes(planId, startDate, dayOfWeek);`
- Render layout:

```
<Stack direction="column" spacing={1.5} sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ width: 72, flexShrink: 0 }}>
    {/* weekday-name + today-circle — unchanged from current */}
  </Stack>

  <Stack
    direction={{ xs: "column", md: "row" }}
    spacing={2}
    alignItems={{ xs: "stretch", md: "flex-start" }}
  >
    <Box sx={{ width: { xs: "100%", md: 280 }, flexShrink: 0 }}>
      <DayLabelSelect
        value={label}
        options={labelOptions}
        isLoading={labelOptionsLoading}
        onChange={(labelId) => updateLabel.mutate({ labelId })}
      />
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <DayNotesField
        value={notes}
        onCommit={(next) => updateNotes.mutate({ notes: next })}
      />
    </Box>
  </Stack>

  <Typography variant="body2" sx={{ color: "text.disabled" }}>
    No sessions
  </Typography>
</Stack>
```

Note the structural shape change: weekday-header is now top row, metadata controls in middle row (responsive), sessions placeholder at bottom. Vertical layout, not flat. Today-circle remains in header row.

**File**: `apps/platform/src/modules/plan-detail/components/week-grid.tsx`

**New props**:

```ts
type WeekGridProps = {
  planId: string;
  monday: Date;
  days: DaySlot[];
  labelOptions: Label[];
  labelOptionsLoading: boolean;
};
```

**Imports**:

```ts
import { Stack } from "@mui/material";

import { dayOfWeekValues } from "@repo/contracts/lms/_shared";
import type { DaySlot } from "@repo/contracts/lms/day";
import type { Label } from "@repo/contracts/lms/label";
import { formatDateParam, getWeekDays } from "@repo/shared";

import { DayRow } from "./day-row";
```

**Body**:

```tsx
export const WeekGrid: React.FC<WeekGridProps> = ({
  planId,
  monday,
  days,
  labelOptions,
  labelOptionsLoading,
}) => {
  const startDate = formatDateParam(monday);

  return (
    <Stack sx={{ borderTop: 1, borderColor: "divider" }}>
      {getWeekDays(monday).map((date, idx) => {
        const dayOfWeek = dayOfWeekValues[idx];
        const day = days.find((d) => d.dayOfWeek === dayOfWeek);

        return (
          <DayRow
            key={formatDateParam(date)}
            date={date}
            planId={planId}
            startDate={startDate}
            dayOfWeek={dayOfWeek}
            label={day?.label ?? null}
            notes={day?.notes ?? null}
            labelOptions={labelOptions}
            labelOptionsLoading={labelOptionsLoading}
          />
        );
      })}
    </Stack>
  );
};
```

**Why index-based `dayOfWeekValues[idx]`**: `getWeekDays(monday)` returns 7 Dates in Mon..Sun order; `dayOfWeekValues` is `["MONDAY", ..., "SUNDAY"]` in the same order. Index-by-index mapping is byte-stable and avoids any `Date.getDay()` Sunday-edge correction. If `getWeekDays` ever returns < 7 dates, `dayOfWeekValues[idx]` becomes `undefined` and TypeScript will surface; pre-condition test if needed in Phase 4 verification.

**Note on TS narrowing**: `dayOfWeekValues[idx]` has type `DayOfWeek | undefined` under `noUncheckedIndexedAccess: true` (verify in `packages/typescript-config/base.json`). If the tsconfig has this on, narrow via `if (!dayOfWeek) return null;` or assert via const inside `.map` with explicit `dayOfWeekValues[idx]!` would violate `[[type-quality]]` no-`!`-rule. Preferred: rewrite as `dayOfWeekValues.map((dayOfWeek, idx) => { const date = getWeekDays(monday)[idx]; ... })` — invert the iteration so `dayOfWeek` is the loop variable (always defined), and `date` is `Date | undefined`. Same null-handling concern, just on different variable. **Pick the approach that types cleanly without `!`**; verify by running `pnpm --filter platform check-types` after Phase 3.

### Phase 4 — `PlanDetailView` wire + `components/index.ts` barrel

**File**: `apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx`

**Add hook call** (after existing `useWeek` line):

```ts
const { data: labelOptions = [], isLoading: labelOptionsLoading } = useLabelSearch({
  level: "DAY",
});
```

**Update WeekGrid invocation** (replace `<WeekGrid monday={activeMonday} />`):

```tsx
<WeekGrid
  planId={planId}
  monday={activeMonday}
  days={weekData?.days ?? []}
  labelOptions={labelOptions}
  labelOptionsLoading={labelOptionsLoading}
/>
```

**Add import**:

```ts
import { useLabelSearch, useTrainingPlan, useUpdateTrainingPlan, useWeek } from "@app/lib/hooks";
```

(maintain alphabetic order within the import). No other changes to PlanDetailView.

**File**: `apps/platform/src/modules/plan-detail/components/index.ts`

Add `DayLabelSelect` + `DayNotesField` exports. Final state per § 0.5.

---

## § 4. Out of scope (do NOT do)

- ❌ Edit any contract / `packages/contracts/` file.
- ❌ Edit any api-server / `packages/api-server/` file.
- ❌ Edit `packages/api-routes/`.
- ❌ Edit any hook file (`use-day-metadata.ts`, `use-label-search.ts`, `use-week-mutation.ts`) — Step 6.5 just shipped them; this step consumes byte-identical.
- ❌ Edit `apps/admin/` (different bounded context).
- ❌ Add SessionCard / Add-Session CTA / @dnd-kit / Session CRUD UI (Step 6.7).
- ❌ Add Day auto-cleanup-when-empty logic (D7 explicit breadcrumb policy).
- ❌ Add ZWS strip on Day notes (OQ-C — deferred follow-up).
- ❌ Extract `@repo/ui/label-select` (OQ-B — premature; Step 6.7 trigger).
- ❌ Add unit tests for new components (UI-layer mirror Step 5 + 6.5 precedent; coverage via browser smoke-test).
- ❌ Refactor WeekNotes to share blur-commit logic with DayNotesField (premature DRY at 2 callsites; revisit if 3rd surface needs it).
- ❌ Add code comments (per `[[global-preferences]]`; identifiers must self-document).
- ❌ Memoize anything via `useMemo`/`useCallback` without a measured perf reason (premature optimization).

---

## § 5. Acceptance criteria

### § 5.1 Verification commands (run from repo root)

```bash
pnpm check-types                # expect 16/16
pnpm lint                       # expect 16/16
pnpm test                       # expect 958/958 (no test deltas)
pnpm dep:check                  # expect 0 violations / 1146-1148 modules (+2 new files)
```

### § 5.2 Grep regressions (run after all phases)

```bash
# New UI callsites — was 0 before Step 6.6
grep -rn "useUpdateDayLabel\|useUpdateDayNotes" apps/platform/src/modules/ | wc -l
# Expected: ≥ 1 (DayRow) + ≥ 1 = 2

grep -rn "useLabelSearch" apps/platform/src/modules/ | wc -l
# Expected: ≥ 1 (PlanDetailView)

# Cross-namespace regression check (D8 invariant)
grep -rn "@repo/contracts/cms/\(label\|exercise\)\|@repo/api-server/cms" apps/platform/src/modules/plan-detail/
# Expected: 0 hits

# Component file count
ls apps/platform/src/modules/plan-detail/components/*.tsx | wc -l
# Expected: 6 (day-label-select, day-notes-field, day-row, week-grid, week-navigator, week-notes)

# Barrel export count
grep -c "^export" apps/platform/src/modules/plan-detail/components/index.ts
# Expected: 6
```

### § 5.3 Manual smoke-test scenario (executor's responsibility to document; user runs in browser)

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

### § 5.4 What "done" means

All five must hold simultaneously:

1. § 5.1 commands all green.
2. § 5.2 grep regressions all match expected counts.
3. § 5.3 smoke-test scenario passes 12/12 steps in the user's browser.
4. Husky pre-commit clean (no `--no-verify`).
5. `output.md` written with all sections per § 8 below.

---

## § 6. File-by-file inventory (final state)

| Path                                                                    | Change   | LOC delta (rough)  |
| ----------------------------------------------------------------------- | -------- | ------------------ |
| `apps/platform/src/modules/plan-detail/components/day-label-select.tsx` | NEW      | +65                |
| `apps/platform/src/modules/plan-detail/components/day-notes-field.tsx`  | NEW      | +50                |
| `apps/platform/src/modules/plan-detail/components/day-row.tsx`          | REWRITE  | +35 / −5 (net +30) |
| `apps/platform/src/modules/plan-detail/components/week-grid.tsx`        | REWRITE  | +25 / −5 (net +20) |
| `apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx`      | EXTEND   | +8 / −1 (net +7)   |
| `apps/platform/src/modules/plan-detail/components/index.ts`             | ADDITIVE | +2                 |

**Total**: 6 files touched (2 new, 4 modified); ~+175 LOC net.

No file added/modified outside `apps/platform/src/modules/plan-detail/`.

---

## § 7. Commit strategy

Per `[[husky-cross-package-squash]]` check (§ 0.6 husky reads):

- Pre-commit gate: `turbo check-types --filter="...[HEAD]"`. Scope = `apps/platform` only. No cross-package broken intermediate state.
- Pre-push gate: `dep:check + turbo lint check-types --filter="...[origin/main]"`. Same scope-confinement.

**Conclusion**: 1 atomic commit OK; no squash needed.

### § 7.1 Code commit

**Subject** (≤ 100 chars, fully lowercase per commitlint):

```
feat(platform): reshape day-row header with label autocomplete and notes field
```

(79 chars including `feat(platform): `)

**Body** (lines ≤ 100 chars):

```
First production ui consumer of step 6.5 hooks (useUpdateDayLabel, useUpdateDayNotes,
useLabelSearch). DayRow now owns day-level label and notes write paths; Sessions area
stays placeholder pending Step 6.7.

Per-file changes:
- new day-label-select.tsx: mui Autocomplete<Label>, slotProps + CircularProgress per
  coach-owner-autocomplete precedent. Server preloads via useLabelSearch level=DAY.
- new day-notes-field.tsx: multiline TextField with blur-commit, mirrors WeekNotes
  committedRef + isFocusedRef + trim invariant. Client cap maxLength=2000.
- day-row reshape: stacked layout (header + responsive label/notes row + sessions
  placeholder). Owns useUpdateDayLabel + useUpdateDayNotes mutations.
- week-grid signature: accepts planId + days + label option list; threads through
  dayOfWeekValues index map. Index-by-index Mon..Sun stable.
- plan-detail-view: calls useLabelSearch({level:"DAY"}) once at view mount; drills
  options + loading to WeekGrid (single source of truth per OQ-A).
- components/index.ts: alphabetic insert of two new exports.

No schema / contract / api-server / route / hook deltas. No tests added (mirror Step 5
plan-detail-shell + Step 6.5 hook-layer precedent; coverage via browser smoke-test).
```

### § 7.2 Docs commit (separate, after Step 6.6 step-prompt + output.md exist)

**Subject**:

```
docs(step-06.6): write executor output report
```

**Body**:

```
Output for Step 6.6 dayrow header reshape. Self-contained per workflow.
```

(both files staged; `prompt.md` was authored by planner pre-execution.)

### § 7.3 Hook escape-hatch

If pre-commit `turbo check-types` fails:

1. DO NOT `--no-verify`.
2. Read the error. Determine if it's a real type defect or planner's spec issue.
3. If planner spec is wrong (e.g. § 0 verbatim diverged — § 0.9 STOP-and-surface trigger): run `AskUserQuestion`.
4. If real defect: fix it (rewrite the type narrowing, e.g. invert WeekGrid iteration as discussed § 3 Phase 3), re-stage, re-commit.

---

## § 8. Output (`implementation/step-06.6/output.md`)

Standard executor report per `WORKFLOW.md § "output.md format"`:

```markdown
## Что сделано

- <2-4 sentences narrating the shipped diff>

## Изменённые/созданные файлы

- <bullet list with paths + (new) / (modified) + brief 1-line purpose>

## Принятые решения

- D-1 — <decision name>: <1-2 sentence justification>
- D-2 — ...
  (use D-N numbering; record any non-trivial decision that deviated from prompt or any TS-narrowing approach used in Phase 3)

## Возникшие вопросы и как решены

- (if no escalations: "Zero § 0 STOP-and-surface escalations; all verbatim quotes matched HEAD <sha> byte-for-byte.")
- Otherwise per-question entry: name, surface mechanism, resolution path.

## Что отложено

- ZWS / control-char normalization in Day notes (per OQ-C; document as next-step trigger)
- @repo/ui label-select extraction (per OQ-B; Step 6.7 trigger if duplication ≥ 90%)
- WeekNotes ↔ DayNotesField shared blur-commit primitive (revisit if 3rd surface needs it; Step 7 Block notes?)

## Verification notes

- `pnpm check-types`: <result>
- `pnpm lint`: <result>
- `pnpm test`: <result>
- `pnpm dep:check`: <result>
- Grep regressions per § 5.2: <table or bulleted results>

## Сценарий смоук-теста

(copy § 5.3 verbatim — 12 steps + preconditions + rollback)

## Acceptance criteria self-check

| Criterion                              | Status                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------- |
| § 5.1 commands green                   | ☐                                                                      |
| § 5.2 grep counts match                | ☐                                                                      |
| § 5.3 smoke-test 12/12                 | ☐ (user-driven; mark "user-pending" if exec finishes before user runs) |
| Husky pre-commit clean без --no-verify | ☐                                                                      |
| output.md sections complete            | ☐                                                                      |
```

---

## § 9. Style invariants (carry-forward from project + global preferences)

- **No code comments** unless encoding a non-obvious WHY (single line ≤ 100 chars). New components self-document via prop names.
- **English** for code/commits/PRs/comments; chat-prose с user planner-side only.
- **No `Co-Authored-By` / `Generated-with`** trailers.
- **No `--no-verify` / `--no-edit` / `--no-gpg-sign`** ever.
- **No `as any` / `as unknown` / unjustified `!`** per `[[type-quality]]`.
- **`exactOptionalPropertyTypes: true`** is on — use conditional-spread `{...(value !== undefined && { value })}` for optional pass-through, not `?? undefined`.
- **No `import * as React from "react"`** — repo convention is named imports only.
- **`"use client"` directive** on top of components that own state / mutations / browser APIs (Phase 1, 2, 3 all need it).
- **Commitlint**: subject ≤ 100 chars, fully lowercase (acronyms too — `mui` not `MUI`); body lines ≤ 100 chars (per `[[commitlint-subject-case]]` and Step 6.1 PROMPT-001 precedent).
- Memory **must not** be searched for prior-implementation details of `plan-detail`. Per WORKFLOW.md § "Forbidden" item 1 + § "Context": this is the 4th attempt; priors deleted; any prior-implementation trace (vocab `coach always edit mode`, `plan-editor rollback`, `per-block atomic save`) → STOP and surface.

---

## § 10. Pre-flight checklist (executor runs before Phase 1)

Tick mentally before writing any code:

- ☐ Verified § 0.1-0.7 verbatim quotes match HEAD `50d83f66` byte-for-byte.
- ☐ Verified `grep -rn "useUpdateDayLabel\|useUpdateDayNotes\|useLabelSearch" apps/platform/src/modules/` returns 0 hits.
- ☐ Verified `apps/platform/src/lib/hooks/index.ts` already exports `use-day-metadata`, `use-label-search`, `use-week-mutation` (lines 6, 7, 11).
- ☐ Verified `apps/platform/src/lib/api/endpoints/index.ts` already exports `createDayMetadataAPI` + `createLabelsAPI` (lines 5, 6).
- ☐ Verified `.husky/pre-commit` config matches § 0.6.
- ☐ Read `domain-model.md §1.1` (Day attributes + invariants).
- ☐ Read `domain-model.md §1.8` (Label `applicable_levels` semantics).
- ☐ Read OQ resolutions table § 0.8 — A1 / B1 / C1 / D1 / E1.
- ☐ Confirmed scope-only-in-`apps/platform/src/modules/plan-detail/` + `apps/platform/src/modules/plan-detail/views/`.

If any ☐ unverified — return to § 0.

---

**End of Step 6.6 prompt**.

Self-contained brief; no Research / Design stages from `/feature` needed. Run Phase 1 → Phase 2 → Phase 3 → Phase 4; verify per § 5.1-5.2; commit per § 7; write `output.md` per § 8.

For browser smoke-test (§ 5.3) — executor stops after § 5.2 + commit + output.md draft (with smoke-test scenario embedded but unchecked). User runs the 12 steps and reports back; planner closes Step 6.6 on green pass.
