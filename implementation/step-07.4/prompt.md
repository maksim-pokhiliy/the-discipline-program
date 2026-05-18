# Step 07.4 — Block UI (BlockList + BlockCard + AddBlockButton + BlockLabelSelect + BlockNotesField + Context refactor)

> Seventh sub-step of Step 7 decomposition. **First Block UI surface; first scenario-based browser smoke-test in Step 7.x.** Consumes Step 7.3.5 widened `sessionWithLabelSchema.blocks` shape transparently via TS types + Step 7.3 5 hooks. Closes deferred Step 7.3 R1 (3rd `useLabelSearch({level:"BLOCK"})` callsite) + Step 6.6/6.7 Context-extract triggers (5-6 level prop drilling chain materializes here). Last code commit before Step 7.5 → `[[training-domain-validation-gate]]` coach validation pause.

---

## Execution mode

- **Wrapper**: `/feature` **full pipeline** (research + design + plan + review + Stage 6 hostile QA + scenario-based browser smoke — multi-file UI surface + Context refactor + `@repo/ui` extension justify full Stage 6 + browser smoke per Step 6.6 + 6.7 precedent).
- **Branch**: stay on `feat/training-domain`. **DO NOT cut a new `feat/<slug>` branch.** Override per `[[always-via-feature-skill]]` + `[[training-domain-workflow]]` (long-lived single branch convention; PR batched after Step 7.5 close-out per `[[training-domain-validation-gate]]` timing).
- **Commit strategy**: **5 per-layer atomic commits** (see § 7 — verified against live `.husky/{pre-commit,pre-push}` + `turbo.json` + commitlint config; no cross-package broken trees expected so no squash required per `[[husky-cross-package-squash]]` pre-check; mirror Step 6.7 5-commit pattern).
- **Husky hooks**: NEVER `--no-verify` / `--no-edit` / `--no-gpg-sign`. Pre-commit + commit-msg + pre-push must pass clean. If any hook blocks — diagnose root cause + fix; surface to user if non-trivial.
- **Commit language**: subject + body fully English. Pre-commit hook (`scripts/check-secrets.mjs` reads commit messages) blocks Cyrillic in subjects (commitlint subject-case = lower-case enforced; commit-msg via `commitlint --edit $1`). **Per Step 7.3.6 D-4 lesson**: prefer `-m` flags over HEREDOC for multi-paragraph bodies — long lines с em-dashes can trigger footer-split and stricter `footer-max-line-length: 100` failure.

---

## § 0. Hard triggers — STOP-and-surface protocol

> Per `[[planner-verbatim-registration]]` + `[[planner-consumer-pattern-read]]` + `[[planner-adversarial-review]]` + `[[husky-cross-package-squash]]` + `[[planner-read-surface-trace]]` + `[[planner-mutation-invariant-trace]]`: every verbatim quote below was captured at prompt-write time (2026-05-18, HEAD `d4669f35`). **Before executing § 3, re-Read each cited path and confirm byte-for-byte match.** Any drift → STOP, surface to user via `AskUserQuestion` with diff + hypothesis. Do not silently adapt.

### § 0.1 `@repo/ui` `LabelSelect` (`packages/ui/src/components/label-select/index.tsx`, full verbatim)

```typescript
"use client";

import { Autocomplete, CircularProgress, TextField } from "@mui/material";

import type { Label } from "@repo/contracts/lms/label";

type LabelSelectProps = {
  value: Label | null;
  options: Label[];
  isLoading: boolean;
  onChange: (labelId: string | null) => void;
  disabled?: boolean | undefined;
  label?: string | undefined;
  placeholder?: string | undefined;
};

const getOptionLabel = (option: Label) => option.name;

export const LabelSelect = ({
  value,
  options,
  isLoading,
  onChange,
  disabled = false,
  label = "Label",
  placeholder = "Select…",
}: LabelSelectProps) => (
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
          label={label}
          placeholder={placeholder}
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

**Edit target (Phase 1)**: extend props к discriminated union supporting both single (`multiple: false | undefined`) and multi (`multiple: true`) modes. Existing callsites (DayLabelSelect + SessionLabelSelect) untouched (default `multiple: false`).

### § 0.2 `session-card.tsx` canonical mirror для `BlockCard` (`apps/platform/src/modules/plan-detail/components/session-card.tsx`, full verbatim)

```typescript
"use client";

import { useRef, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack } from "@mui/material";

import type { SessionWithLabel } from "@repo/contracts/lms/day";
import type { Label } from "@repo/contracts/lms/label";
import { ConfirmationModal } from "@repo/ui";

import { useDeleteSession, useUpdateSession } from "@app/lib/hooks";

import { SessionLabelSelect } from "./session-label-select";
import { SessionNotesField } from "./session-notes-field";

type SessionCardProps = {
  session: SessionWithLabel;
  planId: string;
  startDate: string;
  sessionLabelOptions: Label[];
  sessionLabelOptionsLoading: boolean;
};

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  planId,
  startDate,
  sessionLabelOptions,
  sessionLabelOptionsLoading,
}) => {
  const updateSession = useUpdateSession(planId, startDate);
  const deleteSession = useDeleteSession(planId, startDate);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: session.id,
    disabled: updateSession.isPending || deleteSession.isPending,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleLabelChange = (labelId: string | null) =>
    updateSession.mutate({ sessionId: session.id, data: { labelId } });

  const handleNotesCommit = (notes: string | null) =>
    updateSession.mutate({ sessionId: session.id, data: { notes } });

  const handleDeleteConfirm = () => {
    deleteSession.mutate({ sessionId: session.id }, { onSuccess: () => setDeleteOpen(false) });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        p: 1.5,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <IconButton
          {...attributes}
          {...listeners}
          size="small"
          aria-label="Drag session"
          sx={{ cursor: "grab", touchAction: "none" }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>

        <Box sx={{ width: 240, flexShrink: 0 }}>
          <SessionLabelSelect
            value={session.label}
            options={sessionLabelOptions}
            isLoading={sessionLabelOptionsLoading}
            onChange={handleLabelChange}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SessionNotesField value={session.notes} onCommit={handleNotesCommit} />
        </Box>

        <IconButton
          ref={anchorRef}
          onClick={() => setMenuOpen(true)}
          aria-label="Session actions"
          size="small"
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Menu anchorEl={anchorRef.current} open={menuOpen} onClose={() => setMenuOpen(false)}>
        <MenuItem
          onClick={() => {
            setMenuOpen(false);
            setDeleteOpen(true);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete session"
        type="danger"
        message="Delete this session?"
        details={session.label?.name ?? "Empty session"}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteSession.isPending}
      />
    </Box>
  );
};
```

**Phase 3 target**: drop `sessionLabelOptions` + `sessionLabelOptionsLoading` props; `SessionLabelSelect` migrates to internal `useLabelOptions("SESSION")` hook.

**Phase 5 target**: replace `<Typography>No blocks</Typography>` placeholder (if any) с `<BlockList session={session} planId={planId} startDate={startDate} />`. Per current source — there's NO placeholder yet; SessionCard ends с kebab + ConfirmationModal. **BlockList integration adds a new section below the kebab row** (within the outer `<Box>`) so each SessionCard shows its blocks.

### § 0.3 `session-list.tsx` canonical mirror для `BlockList` (`apps/platform/src/modules/plan-detail/components/session-list.tsx`, full verbatim)

```typescript
"use client";

import { useEffect, useState } from "react";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Box, Stack } from "@mui/material";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type { SessionWithLabel } from "@repo/contracts/lms/day";
import type { Label } from "@repo/contracts/lms/label";

import { useReorderSessions } from "@app/lib/hooks";

import { AddSessionButton } from "./add-session-button";
import { SessionCard } from "./session-card";

type SessionListProps = {
  planId: string;
  startDate: string;
  dayOfWeek: DayOfWeek;
  sessions: SessionWithLabel[];
  sessionLabelOptions: Label[];
  sessionLabelOptionsLoading: boolean;
};

export const SessionList: React.FC<SessionListProps> = ({
  planId,
  startDate,
  dayOfWeek,
  sessions,
  sessionLabelOptions,
  sessionLabelOptionsLoading,
}) => {
  const reorderSessions = useReorderSessions(planId, startDate, dayOfWeek);
  const [sortedSessions, setSortedSessions] = useState<SessionWithLabel[]>(sessions);

  useEffect(() => {
    setSortedSessions(sessions);
  }, [sessions]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedSessions.findIndex((s) => s.id === active.id);
    const newIndex = sortedSessions.findIndex((s) => s.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previousOrder = sortedSessions;
    const nextOrder = arrayMove(sortedSessions, oldIndex, newIndex);

    setSortedSessions(nextOrder);
    reorderSessions.mutate(
      { orderedIds: nextOrder.map((s) => s.id) },
      {
        onError: () => setSortedSessions(previousOrder),
      },
    );
  };

  return (
    <Stack spacing={1.5}>
      {sortedSessions.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={sortedSessions.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={1}>
              {sortedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  planId={planId}
                  startDate={startDate}
                  sessionLabelOptions={sessionLabelOptions}
                  sessionLabelOptionsLoading={sessionLabelOptionsLoading}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      ) : null}

      <Box>
        <AddSessionButton planId={planId} startDate={startDate} dayOfWeek={dayOfWeek} />
      </Box>
    </Stack>
  );
};
```

**Phase 3 target**: drop `sessionLabelOptions` + `sessionLabelOptionsLoading` props (SessionCard consumes Context directly).

**Phase 4 target**: `BlockList` mirrors this 1:1 with **key differences**: takes `{session: SessionWithLabel, planId: string, startDate: string}`; uses `session.blocks` instead of separate `sessions` array; `useReorderBlocks(planId, startDate, session.id)` instead of `useReorderSessions(...)`; renders `BlockCard` children; `<AddBlockButton planId planId={planId} startDate={startDate} sessionId={session.id} />` at bottom. **NO** sessionLabelOptions chain (BlockLabelSelect uses Context).

### § 0.4 `add-session-button.tsx` canonical mirror для `AddBlockButton` (`apps/platform/src/modules/plan-detail/components/add-session-button.tsx`, full verbatim)

```typescript
"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";

import { useCreateSession } from "@app/lib/hooks";

type AddSessionButtonProps = {
  planId: string;
  startDate: string;
  dayOfWeek: DayOfWeek;
};

export const AddSessionButton: React.FC<AddSessionButtonProps> = ({
  planId,
  startDate,
  dayOfWeek,
}) => {
  const createSession = useCreateSession(planId, startDate, dayOfWeek);

  return (
    <Button
      onClick={() => createSession.mutate({})}
      startIcon={<AddIcon />}
      disabled={createSession.isPending}
      size="small"
      variant="outlined"
    >
      Add session
    </Button>
  );
};
```

**Phase 4 target**: `AddBlockButton` mirror takes `{planId: string, startDate: string, sessionId: string}` (no `DayOfWeek` — Block URLs id-addressed per Step 7.3 API design). Uses `useCreateBlock(planId, startDate, sessionId)` mutate `{}` для instant-create (server applies `{intensity:null, timeCap:null, notes:null, order=max+10, labels:[]}` defaults per Step 7.1). Button text "Add block".

### § 0.5 `session-label-select.tsx` canonical mirror для refactor + `BlockLabelSelect` (`apps/platform/src/modules/plan-detail/components/session-label-select.tsx`, full verbatim)

```typescript
"use client";

import type { Label } from "@repo/contracts/lms/label";
import { LabelSelect } from "@repo/ui";

type SessionLabelSelectProps = {
  value: Label | null;
  options: Label[];
  isLoading: boolean;
  onChange: (labelId: string | null) => void;
  disabled?: boolean | undefined;
};

export const SessionLabelSelect = ({
  value,
  options,
  isLoading,
  onChange,
  disabled = false,
}: SessionLabelSelectProps) => (
  <LabelSelect
    value={value}
    options={options}
    isLoading={isLoading}
    onChange={onChange}
    disabled={disabled}
    label="Session label"
    placeholder="Tag this session…"
  />
);
```

**Phase 3 target**: drop `options` + `isLoading` props from signature; internal `useLabelOptions("SESSION")` hook consumes Context. Final shape:

```typescript
type SessionLabelSelectProps = {
  value: Label | null;
  onChange: (labelId: string | null) => void;
  disabled?: boolean | undefined;
};
```

Internal: `const { options, isLoading } = useLabelOptions("SESSION");`.

**Phase 4 target**: `BlockLabelSelect` parallels but uses `multiple={true}` on extended `LabelSelect`:

```typescript
type BlockLabelSelectProps = {
  value: Label[];
  onChange: (labelIds: string[]) => void;
  disabled?: boolean | undefined;
};
```

Internal: `const { options, isLoading } = useLabelOptions("BLOCK"); return <LabelSelect multiple value={value} options={options} isLoading={isLoading} onChange={onChange} ... label="Block labels" placeholder="Tag this block…" />`.

### § 0.6 `day-label-select.tsx` second refactor target (`apps/platform/src/modules/plan-detail/components/day-label-select.tsx`, full verbatim)

```typescript
"use client";

import type { Label } from "@repo/contracts/lms/label";
import { LabelSelect } from "@repo/ui";

type DayLabelSelectProps = {
  value: Label | null;
  options: Label[];
  isLoading: boolean;
  onChange: (labelId: string | null) => void;
  disabled?: boolean | undefined;
};

export const DayLabelSelect = ({
  value,
  options,
  isLoading,
  onChange,
  disabled = false,
}: DayLabelSelectProps) => (
  <LabelSelect
    value={value}
    options={options}
    isLoading={isLoading}
    onChange={onChange}
    disabled={disabled}
    label="Day label"
    placeholder="Tag this day…"
  />
);
```

**Phase 3 target**: identical pattern к SessionLabelSelect — drop `options` + `isLoading`, use `useLabelOptions("DAY")` internally.

### § 0.7 `session-notes-field.tsx` canonical mirror для `BlockNotesField` (`apps/platform/src/modules/plan-detail/components/session-notes-field.tsx`, full verbatim)

```typescript
"use client";

import { TextField } from "@mui/material";

import { SESSION_CONSTANTS } from "@repo/contracts/lms/session";

import { useBlurCommit } from "@app/lib/hooks";

type SessionNotesFieldProps = {
  value: string | null;
  onCommit: (next: string | null) => void;
};

export const SessionNotesField = ({ value, onCommit }: SessionNotesFieldProps) => {
  const { draft, setDraft, handleFocus, handleBlur } = useBlurCommit({ value, onCommit });

  return (
    <TextField
      label="Session notes"
      placeholder="Notes for this session…"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      multiline
      minRows={2}
      fullWidth
      size="small"
      inputProps={{ maxLength: SESSION_CONSTANTS.MAX_NOTES_LENGTH }}
    />
  );
};
```

**Phase 4 target**: `BlockNotesField` 1:1 mirror — same props shape, swap `SESSION_CONSTANTS.MAX_NOTES_LENGTH` к `BLOCK_CONSTANTS.MAX_NOTES_LENGTH` (defined in `@repo/contracts/lms/block`), label "Block notes", placeholder "Notes for this block…". 4th `useBlurCommit` callsite (per `[[planner-verbatim-registration]]` deferred trigger — Step 6.7 noted "3rd surface trigger; BlockNotes? — Step 7 candidate").

### § 0.8 `plan-detail-view.tsx` Context refactor entry point (`apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx`, full verbatim)

```typescript
"use client";

import { Stack } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { formatDateParam, getMonday, parseDateParam } from "@repo/shared";
import { PageHeader, PlanStatusChip, QueryWrapper } from "@repo/ui";

import { useLabelSearch, useTrainingPlan, useUpdateTrainingPlan, useWeek } from "@app/lib/hooks";

import { WeekGrid, WeekNavigator, WeekNotes } from "../components";

type PlanDetailViewProps = { planId: string };

export const PlanDetailView = ({ planId }: PlanDetailViewProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const weekParam = searchParams.get("week");
  const parsed = weekParam ? parseDateParam(weekParam) : null;
  const activeMonday = parsed ? getMonday(parsed) : getMonday(new Date());

  const { data: plan, isLoading, error } = useTrainingPlan(planId);
  const { data: weekData } = useWeek(planId, formatDateParam(activeMonday));
  const { data: labelOptions = [], isLoading: labelOptionsLoading } = useLabelSearch({
    level: "DAY",
  });
  const { data: sessionLabelOptions = [], isLoading: sessionLabelOptionsLoading } = useLabelSearch({
    level: "SESSION",
  });
  const updatePlan = useUpdateTrainingPlan();

  const pushWeekParam = (nextMonday: Date) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("week", formatDateParam(nextMonday));
    router.push(`${pathname}?${params}`, { scroll: false });
  };

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
          <WeekGrid
            planId={planId}
            monday={activeMonday}
            days={weekData?.days ?? []}
            labelOptions={labelOptions}
            labelOptionsLoading={labelOptionsLoading}
            sessionLabelOptions={sessionLabelOptions}
            sessionLabelOptionsLoading={sessionLabelOptionsLoading}
          />
        </Stack>
      )}
    </QueryWrapper>
  );
};
```

**Phase 3 target**: drop 2 `useLabelSearch` calls (moved into Provider internally); drop 4 prop assignments from `<WeekGrid>` call (labelOptions/labelOptionsLoading/sessionLabelOptions/sessionLabelOptionsLoading); wrap children в `<LabelOptionsProvider>`. Final shape excerpt:

```typescript
import { LabelOptionsProvider } from "@app/lib/contexts";
// ... remove useLabelSearch import

// In return:
<LabelOptionsProvider>
  <Stack spacing={4}>
    {/* ... PageHeader + WeekNavigator + WeekNotes unchanged ... */}
    <WeekGrid planId={planId} monday={activeMonday} days={weekData?.days ?? []} />
  </Stack>
</LabelOptionsProvider>
```

### § 0.9 `week-grid.tsx` Context refactor target (`apps/platform/src/modules/plan-detail/components/week-grid.tsx`, full verbatim)

```typescript
import { Stack } from "@mui/material";

import { dayOfWeekValues } from "@repo/contracts/lms/_shared";
import type { DaySlot } from "@repo/contracts/lms/day";
import type { Label } from "@repo/contracts/lms/label";
import { formatDateParam, getWeekDays } from "@repo/shared";

import { DayRow } from "./day-row";

type WeekGridProps = {
  planId: string;
  monday: Date;
  days: DaySlot[];
  labelOptions: Label[];
  labelOptionsLoading: boolean;
  sessionLabelOptions: Label[];
  sessionLabelOptionsLoading: boolean;
};

export const WeekGrid: React.FC<WeekGridProps> = ({
  planId,
  monday,
  days,
  labelOptions,
  labelOptionsLoading,
  sessionLabelOptions,
  sessionLabelOptionsLoading,
}) => {
  const startDate = formatDateParam(monday);
  const dates = getWeekDays(monday);

  return (
    <Stack sx={{ borderTop: 1, borderColor: "divider" }}>
      {dayOfWeekValues.map((dayOfWeek, idx) => {
        const date = dates[idx];

        if (!date) {
          return null;
        }

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
            sessions={day?.sessions ?? []}
            labelOptions={labelOptions}
            labelOptionsLoading={labelOptionsLoading}
            sessionLabelOptions={sessionLabelOptions}
            sessionLabelOptionsLoading={sessionLabelOptionsLoading}
          />
        );
      })}
    </Stack>
  );
};
```

**Phase 3 target**: drop 4 label props from signature + 4 prop assignments on `<DayRow>` call. Remove `Label` import. Final signature:

```typescript
type WeekGridProps = {
  planId: string;
  monday: Date;
  days: DaySlot[];
};
```

### § 0.10 `day-row.tsx` Context refactor target (`apps/platform/src/modules/plan-detail/components/day-row.tsx`, full verbatim)

```typescript
"use client";

import { Box, Stack, Typography } from "@mui/material";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type { SessionWithLabel } from "@repo/contracts/lms/day";
import type { Label } from "@repo/contracts/lms/label";
import { formatDayName, isSameDay } from "@repo/shared";

import { useUpdateDayLabel, useUpdateDayNotes } from "@app/lib/hooks";

import { DayLabelSelect } from "./day-label-select";
import { DayNotesField } from "./day-notes-field";
import { SessionList } from "./session-list";

type DayRowProps = {
  date: Date;
  planId: string;
  startDate: string;
  dayOfWeek: DayOfWeek;
  label: Label | null;
  notes: string | null;
  sessions: SessionWithLabel[];
  labelOptions: Label[];
  labelOptionsLoading: boolean;
  sessionLabelOptions: Label[];
  sessionLabelOptionsLoading: boolean;
};

export const DayRow: React.FC<DayRowProps> = ({
  date,
  planId,
  startDate,
  dayOfWeek,
  label,
  notes,
  sessions,
  labelOptions,
  labelOptionsLoading,
  sessionLabelOptions,
  sessionLabelOptionsLoading,
}) => {
  const updateLabel = useUpdateDayLabel(planId, startDate, dayOfWeek);
  const updateNotes = useUpdateDayNotes(planId, startDate, dayOfWeek);
  const isToday = isSameDay(date, new Date());
  const dayOfMonth = date.getDate();

  return (
    <Stack direction="column" spacing={1.5} sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
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
          <DayNotesField value={notes} onCommit={(next) => updateNotes.mutate({ notes: next })} />
        </Box>
      </Stack>

      <SessionList
        planId={planId}
        startDate={startDate}
        dayOfWeek={dayOfWeek}
        sessions={sessions}
        sessionLabelOptions={sessionLabelOptions}
        sessionLabelOptionsLoading={sessionLabelOptionsLoading}
      />
    </Stack>
  );
};
```

**Phase 3 target**: drop 4 label props from signature + drop `options/isLoading` from `<DayLabelSelect>` call + drop `sessionLabelOptions/sessionLabelOptionsLoading` from `<SessionList>` call. Remove `Label` import. Final signature:

```typescript
type DayRowProps = {
  date: Date;
  planId: string;
  startDate: string;
  dayOfWeek: DayOfWeek;
  label: Label | null;
  notes: string | null;
  sessions: SessionWithLabel[];
};
```

(keeps `Label | null` for the `label` field — that's data, not options.)

### § 0.11 `use-blocks.ts` (Step 7.3 hooks, full verbatim) — consumed by Phase 4

```typescript
"use client";

import type {
  AssignBlockLabelsData,
  Block,
  CreateBlockData,
  ReorderBlocksData,
  UpdateBlockData,
} from "@repo/contracts/lms/block";

import { api } from "../api";

import { useWeekMutation } from "./use-week-mutation";

export const useCreateBlock = (planId: string, startDate: string, sessionId: string) =>
  useWeekMutation<CreateBlockData, Block>({
    mutationFn: (data) => api.blocks.create(planId, sessionId, data),
    planId,
    startDate,
    successMessage: "Block created",
    errorMessage: "Failed to create block",
  });

export const useUpdateBlock = (planId: string, startDate: string) =>
  useWeekMutation<{ blockId: string; data: UpdateBlockData }, Block>({
    mutationFn: ({ blockId, data }) => api.blocks.update(planId, blockId, data),
    planId,
    startDate,
    successMessage: "Block updated",
    errorMessage: "Failed to update block",
  });

export const useDeleteBlock = (planId: string, startDate: string) =>
  useWeekMutation<{ blockId: string }, void>({
    mutationFn: ({ blockId }) => api.blocks.delete(planId, blockId),
    planId,
    startDate,
    successMessage: "Block deleted",
    errorMessage: "Failed to delete block",
  });

export const useReorderBlocks = (planId: string, startDate: string, sessionId: string) =>
  useWeekMutation<ReorderBlocksData, { blocks: Block[] }>({
    mutationFn: (data) => api.blocks.reorder(planId, sessionId, data),
    planId,
    startDate,
    successMessage: "Blocks reordered",
    errorMessage: "Failed to reorder blocks",
  });

export const useAssignBlockLabels = (planId: string, startDate: string) =>
  useWeekMutation<{ blockId: string; data: AssignBlockLabelsData }, Block>({
    mutationFn: ({ blockId, data }) => api.blocks.assignLabels(planId, blockId, data),
    planId,
    startDate,
    successMessage: "Block labels saved",
    errorMessage: "Failed to save block labels",
  });
```

**Critical invariant**: `useAssignBlockLabels` TVars = `{blockId: string; data: AssignBlockLabelsData}` (wrap shape per Step 7.3 R2). BlockCard `handleLabelChange` calls `assignBlockLabels.mutate({blockId: block.id, data: {labelIds: nextIds}})`.

### § 0.12 `use-blur-commit.ts` primitive (`apps/platform/src/lib/hooks/use-blur-commit.ts`, full verbatim) — consumed by Phase 4 BlockNotesField

```typescript
"use client";

import { useEffect, useRef, useState } from "react";

type UseBlurCommitArgs = {
  value: string | null;
  onCommit: (next: string | null) => void;
};

type UseBlurCommitResult = {
  draft: string;
  setDraft: (next: string) => void;
  handleFocus: () => void;
  handleBlur: () => void;
};

export const useBlurCommit = ({ value, onCommit }: UseBlurCommitArgs): UseBlurCommitResult => {
  const [draft, setDraft] = useState(value ?? "");
  const committedRef = useRef(value ?? "");
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(value ?? "");
      committedRef.current = value ?? "";
    }
  }, [value]);

  const handleFocus = () => {
    isFocusedRef.current = true;
    committedRef.current = value ?? "";
  };

  const handleBlur = () => {
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

  return { draft, setDraft, handleFocus, handleBlur };
};
```

**Use as-is**. BlockNotesField passes `{value: block.notes, onCommit: (next) => updateBlock.mutate({blockId: block.id, data: {notes: next}})}`.

### § 0.13 `use-label-search.ts` Context Provider building block (`apps/platform/src/lib/hooks/use-label-search.ts`, full verbatim)

```typescript
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

**Phase 2 use pattern**: `LabelOptionsProvider` internal calls 3x — `useLabelSearch({level: "DAY"})` + `useLabelSearch({level: "SESSION"})` + `useLabelSearch({level: "BLOCK"})`. TanStack cache keys distinct (`platformKeys.labels.search("DAY", undefined)` etc) — independent cached entries; 3 GET requests on first mount, reused thereafter via cache.

### § 0.14 Contract schemas — `blockSchema` + `sessionWithLabelSchema` + `BLOCK_CONSTANTS`

`packages/contracts/src/entities/lms/block/block.schema.ts` (full verbatim):

```typescript
import { z } from "zod";

import { intensitySchema, timeCapSchema } from "../_shared";
import { labelSchema } from "../label";

import { BLOCK_CONSTANTS } from "./block.constants";

export const blockSchema = z.object({
  id: z.string().cuid(),
  sessionId: z.string().cuid(),
  order: z.number().int().positive(),
  intensity: intensitySchema.nullable(),
  timeCap: timeCapSchema.nullable(),
  notes: z.string().nullable(),
  labels: z.array(labelSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBlockSchema = z.object({
  intensity: intensitySchema.nullable().optional(),
  timeCap: timeCapSchema.nullable().optional(),
  notes: z.string().max(BLOCK_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
  labelIds: z
    .array(z.string().cuid())
    .max(BLOCK_CONSTANTS.MAX_LABELS_PER_BLOCK)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "labelIds must be unique",
    })
    .optional(),
});

export const updateBlockSchema = createBlockSchema;

export const reorderBlocksSchema = z.object({
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});

export const assignBlockLabelsSchema = z.object({
  labelIds: z
    .array(z.string().cuid())
    .max(BLOCK_CONSTANTS.MAX_LABELS_PER_BLOCK)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "labelIds must be unique",
    }),
});
```

**Critical**: `Block.labels: z.array(labelSchema)` embedded — multi-label confirmed by contract. `assignBlockLabelsSchema.labelIds` empty-array-valid per Step 7.0 D-7 (server tx delete-all + zero insert) — UI must support clear-all (X на каждом Chip → empty array → clear-all через `useAssignBlockLabels`).

`packages/contracts/src/entities/lms/day/day.schema.ts` post-Step-7.3.5 (full verbatim):

```typescript
import { z } from "zod";

import { dayOfWeekSchema } from "../_shared";
import { blockSchema } from "../block";
import { labelSchema } from "../label";
import { sessionSchema } from "../session";

import { DAY_CONSTANTS } from "./day.constants";

export const sessionWithLabelSchema = sessionSchema.extend({
  label: labelSchema.nullable(),
  blocks: z.array(blockSchema),
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

**Critical**: `SessionWithLabel.blocks: Block[]` shipped Step 7.3.5. BlockList reads `session.blocks` directly. NO API/hook signature change in Step 7.4 — UI consumes widened response shape transparently через TS types.

`packages/contracts/src/entities/lms/block/block.constants.ts` referenced для `MAX_NOTES_LENGTH`. Likely `{MAX_NOTES_LENGTH: 2000, MAX_LABELS_PER_BLOCK: 10}` per Step 7.0 (BlockNotesField uses `BLOCK_CONSTANTS.MAX_NOTES_LENGTH`; BlockLabelSelect respects max-10 при multi-select). **Confirm at execution time** via `Read` before Phase 4 BlockNotesField + BlockLabelSelect.

### § 0.15 Barrels + exports — verbatim at prompt-write time

`packages/ui/src/index.ts` (full verbatim):

```typescript
export * from "./components";
export * from "./hooks";
```

`packages/ui/src/components/index.ts` (full verbatim):

```typescript
export * from "./chip-tab";
export * from "./collapsible-list";
export * from "./data-table";
export * from "./detail-field";
export * from "./error-pages";
export * from "./drawer";
export * from "./dynamic-list-item";
export * from "./empty-state";
export * from "./form-card";
export * from "./form-view";
export * from "./image-upload";
export * from "./inline-edit-text";
export * from "./label-select";
export * from "./layout";
export * from "./loading-state";
export * from "./login-form";
export * from "./logo";
export * from "./modal";
export * from "./multi-select";
export * from "./nav-link-button";
export * from "./page-header";
export * from "./person-card";
export * from "./plan-status-chip";
export * from "./pulse-stat";
export * from "./pulse-stats-card";
export * from "./query-wrapper";
export * from "./markdown-editor";
export * from "./rich-text-viewer";
export * from "./skip-to-content";
export * from "./status-chip";
export * from "./tags-input";
export * from "./stats-card";
export * from "./toast";
export * from "./user-chip";
```

**Phase 1 implication**: `label-select` barrel auto-re-exports the extended `LabelSelect`. **NO** new top-level barrel entry needed (discriminated union extension stays inside `label-select/index.tsx`).

`apps/platform/src/modules/plan-detail/components/index.ts` (full verbatim):

```typescript
export { AddSessionButton } from "./add-session-button";
export { DayLabelSelect } from "./day-label-select";
export { DayNotesField } from "./day-notes-field";
export { DayRow } from "./day-row";
export { SessionCard } from "./session-card";
export { SessionLabelSelect } from "./session-label-select";
export { SessionList } from "./session-list";
export { SessionNotesField } from "./session-notes-field";
export { WeekGrid } from "./week-grid";
export { WeekNavigator } from "./week-navigator";
export { WeekNotes } from "./week-notes";
```

**Phase 4 target**: +5 explicit named exports (alphabetic order — Add, Block\*, then existing). Final shape:

```typescript
export { AddBlockButton } from "./add-block-button";
export { AddSessionButton } from "./add-session-button";
export { BlockCard } from "./block-card";
export { BlockLabelSelect } from "./block-label-select";
export { BlockList } from "./block-list";
export { BlockNotesField } from "./block-notes-field";
export { DayLabelSelect } from "./day-label-select";
export { DayNotesField } from "./day-notes-field";
export { DayRow } from "./day-row";
export { SessionCard } from "./session-card";
export { SessionLabelSelect } from "./session-label-select";
export { SessionList } from "./session-list";
export { SessionNotesField } from "./session-notes-field";
export { WeekGrid } from "./week-grid";
export { WeekNavigator } from "./week-navigator";
export { WeekNotes } from "./week-notes";
```

`apps/platform/src/lib/hooks/index.ts` — confirm at execution time. Phase 2 adds `export * from "./use-label-options"` (alphabetic — between `use-day-metadata` and `use-label-search`). Verify exact line numbering at execution.

`apps/platform/src/lib/contexts/index.ts` — **NEW FILE** (Phase 2). Exports `{LabelOptionsProvider, useLabelOptions}` from `./label-options-provider` + `./use-label-options` (or single file with both — see Phase 2 below). Add re-export point at `apps/platform/src/lib/index.ts` if such barrel exists (verify at execution).

`apps/platform/src/lib/` directory structure (verbatim from prompt-write time):

```
api
components
config
hooks
server
```

**No** `contexts/` folder. **Phase 2 creates it.**

### § 0.A grep enumeration (mandatory pre-execution, per `[[planner-consumer-pattern-read]]`)

Before Phase 1 schema edit, run each grep and confirm expected zero-impact:

```bash
# 1. LabelSelect callsites (Phase 1 extension blast radius)
grep -rn "LabelSelect" apps/platform/src/ packages/ui/src/
# Expected hits: import + export in day-label-select.tsx, session-label-select.tsx, @repo/ui barrel, label-select/index.tsx itself. Phase 1 default-false multi prop preserves existing callsites.

# 2. useLabelSearch callsites (Phase 3 Context migration target)
grep -rn "useLabelSearch" apps/platform/src/
# Expected hits: plan-detail-view.tsx (2 callsites — DAY + SESSION; both move into Provider). After Phase 3, zero direct useLabelSearch outside Provider.

# 3. SessionLabelSelect / DayLabelSelect / SessionNotesField / DayNotesField (Phase 3 prop changes)
grep -rn "SessionLabelSelect\|DayLabelSelect" apps/platform/src/
# Expected hits: imports + JSX usage in session-card.tsx, day-row.tsx, components/index.ts barrel. Phase 3 changes props signatures + drops options/isLoading callsite assignments.

# 4. labelOptions / sessionLabelOptions props chain
grep -rn "labelOptions\|sessionLabelOptions" apps/platform/src/
# Expected hits: prop drilling chain plan-detail-view → WeekGrid → DayRow → DayLabelSelect/SessionList → SessionCard. Phase 3 removes ALL these props.

# 5. SessionWithLabel type (verifies Step 7.3.5 blocks embed reaches UI)
grep -rn "SessionWithLabel" apps/platform/src/ packages/contracts/src/entities/lms/
# Expected hits: type imports in session-card.tsx, session-list.tsx, day-row.tsx + day.schema.ts/types.ts definitions. session.blocks accessed in Phase 5.

# 6. useBlocks / useCreateBlock / useUpdateBlock / useDeleteBlock / useReorderBlocks / useAssignBlockLabels (Phase 4 consumers)
grep -rn "useCreateBlock\|useUpdateBlock\|useDeleteBlock\|useReorderBlocks\|useAssignBlockLabels" apps/platform/src/
# Expected hits: definitions in use-blocks.ts + barrel re-export in hooks/index.ts. Zero direct consumers PRE-Step-7.4. Phase 4 components import all 5.

# 7. @dnd-kit consumers (Phase 4 BlockList reuses)
grep -rn "useSortable\|DndContext\|SortableContext" apps/platform/src/
# Expected hits: session-card.tsx (useSortable) + session-list.tsx (DndContext + SortableContext + helpers). Phase 4 mirrors pattern verbatim in block-card.tsx + block-list.tsx.

# 8. ConfirmationModal callsites (Phase 4 BlockCard kebab Delete pattern)
grep -rn "ConfirmationModal" apps/platform/src/
# Expected hits: session-card.tsx + plan-action-menu (если есть) + other plan-detail Delete flows. Phase 4 BlockCard mirrors session-card pattern.

# 9. useBlurCommit consumers (Phase 4 BlockNotesField = 4th callsite)
grep -rn "useBlurCommit" apps/platform/src/
# Expected hits: definitions + 3 existing callsites (week-notes.tsx, day-notes-field.tsx, session-notes-field.tsx) — verify Step 6.7 extract precedent. Phase 4 adds BlockNotesField = 4th.

# 10. BLOCK_CONSTANTS / SESSION_CONSTANTS (verify constant naming + paths)
grep -rn "BLOCK_CONSTANTS\|SESSION_CONSTANTS" packages/contracts/src/entities/lms/
# Expected hits: constants definition files (block.constants.ts + session.constants.ts) + consumer imports. Confirm BLOCK_CONSTANTS.MAX_NOTES_LENGTH + BLOCK_CONSTANTS.MAX_LABELS_PER_BLOCK exist.
```

If ANY grep produces unexpected hits → STOP, surface to user via `AskUserQuestion` with diff + hypothesis. Do not silently adapt the plan.

### § 0.B Husky hook gates (verbatim, `.husky/{pre-commit,pre-push}`)

`.husky/pre-commit`:

```
node scripts/check-secrets.mjs
npx lint-staged
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"
```

`.husky/pre-push`:

```
pnpm dep:check
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"
```

**Commit-strategy implication** (per `[[husky-cross-package-squash]]`): pre-commit `check-types --filter="...[HEAD]"` propagates через `turbo.json` `dependsOn: ["^check-types"]` к all downstream packages. Phase 1 touches `@repo/ui` → fan-out к consumers (`apps/{admin,platform,marketing}`). Phase 1 is additive (default-false multi prop) → no breaking change → no broken intermediate trees. Phases 2-5 touch only `apps/platform/` → fan-out limited. **All 5 commits independently pass `check-types`** — no squash needed.

### § 0.C Commitlint config (verbatim, `commitlint.config.cjs`)

```javascript
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [2, "always", 150],
    "header-max-length": [2, "always", 100],
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [2, "always", ["lower-case"]],
    "type-case": [2, "always", "lower-case"],
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "test", "chore", "revert", "perf"],
    ],
  },
};
```

**Per Step 7.3.6 D-4 lesson**: prefer multi-`-m` flags over HEREDOC for body. Lines с em-dashes + ≥100 chars can trigger split body→footer + footer-max-line-length:100 conventional default failure. Each `-m` paragraph keeps lines ≤100 chars for universal safety.

---

## § 1. Goal

Ship coach-facing Block UI inside existing SessionCard — BlockList + BlockCard + AddBlockButton + BlockLabelSelect (multi) + BlockNotesField. Includes label-preload React Context refactor that kills the 4-level prop drilling chain materialized по Step 6.6/6.7 deferred trigger (3 levels of label options × 2 categories × WeekGrid → DayRow → SessionList → SessionCard). First scenario-based browser smoke-test в Step 7.x; deep ~18-20 step scenario per `[[training-domain-validation-gate]]` validation confidence.

**Out of scope (E2 ratified at thesis):** Intensity + TimeCap UI rendering — Step 7.5 owns both edit forms AND consistent read-display (no premature visualization commitment в Step 7.4).

---

## § 2. Inputs (all confirmed verbatim at prompt-write time per § 0)

- `@repo/ui` LabelSelect — single-mode `Autocomplete<Label>` (Phase 1 extension target).
- Step 6.7 canonical mirrors — session-card.tsx (138 LOC), session-list.tsx (115 LOC), add-session-button.tsx (35 LOC), session-label-select.tsx (30 LOC), day-label-select.tsx (31 LOC), session-notes-field.tsx (32 LOC) — all 1:1 templates для Block parallel set.
- Step 6.6 drill chain — plan-detail-view.tsx (80 LOC, 2 useLabelSearch + drill), week-grid.tsx (62 LOC, 7 props), day-row.tsx (102 LOC, 11 props).
- Step 7.3.5 contract widening — `sessionWithLabelSchema.blocks: Block[]` embedded; BlockList reads `session.blocks` без API/hook change.
- Step 7.3 hooks — 5 mutation hooks shipped + `useWeekMutation` helper.
- Step 6.7 primitives — `useBlurCommit` (52 LOC); BlockNotesField = 4th callsite.
- Block contract — `blockSchema.labels: Label[]` multi-label confirmed; `assignBlockLabelsSchema.labelIds` empty-array-valid (clear-all).
- Husky pre-commit + commit-msg + pre-push verified compatible с 5 per-layer atomic commits.

---

## § 3. Phases (5 sequential per-layer atomic commits)

### Phase 1 — `@repo/ui` `LabelSelect` extend с discriminated union для multi-mode

**File**: `packages/ui/src/components/label-select/index.tsx`

**Approach**: discriminated union props supporting both single (default) and multi modes. Internal `Autocomplete<Label, true | false>` boolean variance per MUI native pattern. Existing callsites (DayLabelSelect + SessionLabelSelect) preserve current API (default `multiple: false`).

**Final shape** (verbatim target):

```typescript
"use client";

import { Autocomplete, CircularProgress, TextField } from "@mui/material";

import type { Label } from "@repo/contracts/lms/label";

type LabelSelectBaseProps = {
  options: Label[];
  isLoading: boolean;
  disabled?: boolean | undefined;
  label?: string | undefined;
  placeholder?: string | undefined;
};

type LabelSelectSingleProps = LabelSelectBaseProps & {
  multiple?: false | undefined;
  value: Label | null;
  onChange: (labelId: string | null) => void;
};

type LabelSelectMultiProps = LabelSelectBaseProps & {
  multiple: true;
  value: Label[];
  onChange: (labelIds: string[]) => void;
};

type LabelSelectProps = LabelSelectSingleProps | LabelSelectMultiProps;

const getOptionLabel = (option: Label) => option.name;
const isOptionEqualToValue = (option: Label, val: Label) => option.id === val.id;

export const LabelSelect = (props: LabelSelectProps) => {
  const {
    options,
    isLoading,
    disabled = false,
    label = "Label",
    placeholder = "Select…",
  } = props;

  const renderInput = (params: Parameters<React.ComponentProps<typeof Autocomplete<Label>>["renderInput"]>[0]) => {
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
        placeholder={placeholder}
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
  };

  if (props.multiple === true) {
    return (
      <Autocomplete<Label, true>
        multiple
        options={options}
        value={props.value}
        onChange={(_, next) => props.onChange(next.map((label) => label.id))}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={isOptionEqualToValue}
        disabled={disabled || isLoading}
        size="small"
        renderInput={renderInput}
      />
    );
  }

  return (
    <Autocomplete<Label, false>
      options={options}
      value={props.value}
      onChange={(_, next) => props.onChange(next?.id ?? null)}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      disabled={disabled || isLoading}
      size="small"
      renderInput={renderInput}
    />
  );
};
```

**Notes**:

- Discriminated union via `multiple?: false | undefined` vs `multiple: true` — TypeScript narrows `value`/`onChange` types based on `multiple` discriminator.
- Internal `if (props.multiple === true)` runtime branch — type-safe within each branch.
- Extracted `getOptionLabel` + `isOptionEqualToValue` к module scope (was inline before; now reused across branches).
- Extracted `renderInput` к outer scope (avoid closure recreation; reused across branches).
- MUI `Autocomplete<Label, true>` vs `<Label, false>` boolean variance enforces multi vs single value/onChange contract internally.
- Phase 1 commit: only `@repo/ui` touched; existing DayLabelSelect + SessionLabelSelect (callsites) preserve current API via default-false branch; check-types green across fan-out.

**Commit (Phase 1)**:

- Subject: `feat(ui): extend labelselect with multi-mode discriminated union`
- Body: 1-3 paragraphs documenting discriminated union pattern + multi prop addition + zero breaking change (default-false preserves existing callsites).

### Phase 2 — Platform `LabelOptionsProvider` Context + `useLabelOptions` hook

**Files** (NEW):

- `apps/platform/src/lib/contexts/label-options-provider.tsx` (~50 LOC) — new file in new folder.
- `apps/platform/src/lib/contexts/index.ts` (NEW, 2 lines barrel).
- `apps/platform/src/lib/hooks/use-label-options.ts` (~25 LOC) — new hook in existing folder.

**Decision: Provider + hook в separate files** (Provider в `lib/contexts/`, hook в `lib/hooks/`) per existing convention (`use-*.ts` files live in `lib/hooks/`; Context provider component lives in `lib/contexts/` for module separation).

**`label-options-provider.tsx` final shape**:

```typescript
"use client";

import { createContext, type ReactNode } from "react";

import type { Label } from "@repo/contracts/lms/label";

import { useLabelSearch } from "@app/lib/hooks/use-label-search";

export type LabelOptionsLevel = "DAY" | "SESSION" | "BLOCK";

export type LabelOptionsValue = {
  options: Label[];
  isLoading: boolean;
};

export type LabelOptionsContextValue = Record<LabelOptionsLevel, LabelOptionsValue>;

export const LabelOptionsContext = createContext<LabelOptionsContextValue | null>(null);

type LabelOptionsProviderProps = {
  children: ReactNode;
};

export const LabelOptionsProvider = ({ children }: LabelOptionsProviderProps) => {
  const day = useLabelSearch({ level: "DAY" });
  const session = useLabelSearch({ level: "SESSION" });
  const block = useLabelSearch({ level: "BLOCK" });

  const value: LabelOptionsContextValue = {
    DAY: { options: day.data ?? [], isLoading: day.isLoading },
    SESSION: { options: session.data ?? [], isLoading: session.isLoading },
    BLOCK: { options: block.data ?? [], isLoading: block.isLoading },
  };

  return <LabelOptionsContext.Provider value={value}>{children}</LabelOptionsContext.Provider>;
};
```

**`contexts/index.ts` final shape**:

```typescript
export { LabelOptionsContext, LabelOptionsProvider } from "./label-options-provider";
export type {
  LabelOptionsContextValue,
  LabelOptionsLevel,
  LabelOptionsValue,
} from "./label-options-provider";
```

**`use-label-options.ts` final shape**:

```typescript
"use client";

import { useContext } from "react";

import {
  LabelOptionsContext,
  type LabelOptionsLevel,
  type LabelOptionsValue,
} from "@app/lib/contexts";

export const useLabelOptions = (level: LabelOptionsLevel): LabelOptionsValue => {
  const ctx = useContext(LabelOptionsContext);

  if (ctx === null) {
    throw new Error("useLabelOptions must be used within LabelOptionsProvider");
  }

  return ctx[level];
};
```

**`apps/platform/src/lib/hooks/index.ts`** barrel addition (verify current state at execution; alphabetic insertion — between `use-day-metadata` and `use-label-search`):

```typescript
export * from "./use-label-options";
```

**`apps/platform/src/lib/index.ts`** — check if such root barrel exists (likely yes per existing structure). If yes, add `export * from "./contexts";` line. Verify at execution.

**Commit (Phase 2)**:

- Subject: `feat(platform): add labeloptionsprovider context with day session block preload`
- Body: documents Provider responsibility (3x useLabelSearch internal, distinct TanStack cache keys) + hook contract (throws if outside Provider) + barrel additions.

### Phase 3 — Refactor 6 components к Context (atomic prop drop)

**Atomic refactor**: producer + all consumers change in same commit. No intermediate broken trees.

**Files** (6 modifications):

1. **`apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx`** — wrap children в `<LabelOptionsProvider>`; drop 2 `useLabelSearch` calls + their imports; drop 4 prop assignments from `<WeekGrid>` call.

   **Final shape excerpt** (removing 2 `useLabelSearch` calls + adding Provider wrap + cleaning WeekGrid props):

   ```typescript
   "use client";

   import { Stack } from "@mui/material";
   import { usePathname, useRouter, useSearchParams } from "next/navigation";

   import { formatDateParam, getMonday, parseDateParam } from "@repo/shared";
   import { PageHeader, PlanStatusChip, QueryWrapper } from "@repo/ui";

   import { LabelOptionsProvider } from "@app/lib/contexts";
   import { useTrainingPlan, useUpdateTrainingPlan, useWeek } from "@app/lib/hooks";

   import { WeekGrid, WeekNavigator, WeekNotes } from "../components";

   type PlanDetailViewProps = { planId: string };

   export const PlanDetailView = ({ planId }: PlanDetailViewProps) => {
     const router = useRouter();
     const pathname = usePathname();
     const searchParams = useSearchParams();

     const weekParam = searchParams.get("week");
     const parsed = weekParam ? parseDateParam(weekParam) : null;
     const activeMonday = parsed ? getMonday(parsed) : getMonday(new Date());

     const { data: plan, isLoading, error } = useTrainingPlan(planId);
     const { data: weekData } = useWeek(planId, formatDateParam(activeMonday));
     const updatePlan = useUpdateTrainingPlan();

     const pushWeekParam = (nextMonday: Date) => {
       const params = new URLSearchParams(searchParams.toString());

       params.set("week", formatDateParam(nextMonday));
       router.push(`${pathname}?${params}`, { scroll: false });
     };

     return (
       <QueryWrapper isLoading={isLoading} error={error} data={plan} loadingMessage="Loading plan...">
         {(plan) => (
           <LabelOptionsProvider>
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
               <WeekGrid planId={planId} monday={activeMonday} days={weekData?.days ?? []} />
             </Stack>
           </LabelOptionsProvider>
         )}
       </QueryWrapper>
     );
   };
   ```

2. **`apps/platform/src/modules/plan-detail/components/week-grid.tsx`** — drop 4 label props from signature + drop 4 prop assignments on `<DayRow>` call; remove `Label` import.

   **Final signature**:

   ```typescript
   type WeekGridProps = {
     planId: string;
     monday: Date;
     days: DaySlot[];
   };
   ```

   `<DayRow>` call drops `labelOptions/labelOptionsLoading/sessionLabelOptions/sessionLabelOptionsLoading` assignments.

3. **`apps/platform/src/modules/plan-detail/components/day-row.tsx`** — drop 4 label props from signature + drop `options/isLoading` from `<DayLabelSelect>` call + drop `sessionLabelOptions/sessionLabelOptionsLoading` from `<SessionList>` call; remove unused `Label` import (keep `Label` import IF still used for `label` field type).

   **Final signature**:

   ```typescript
   type DayRowProps = {
     date: Date;
     planId: string;
     startDate: string;
     dayOfWeek: DayOfWeek;
     label: Label | null;
     notes: string | null;
     sessions: SessionWithLabel[];
   };
   ```

   (keeps `Label | null` for `label` data field — that's the DAY's currently-assigned label, not options.)

4. **`apps/platform/src/modules/plan-detail/components/session-list.tsx`** — drop 2 props from signature + drop 2 prop assignments on `<SessionCard>` call; remove `Label` import.

   **Final signature**:

   ```typescript
   type SessionListProps = {
     planId: string;
     startDate: string;
     dayOfWeek: DayOfWeek;
     sessions: SessionWithLabel[];
   };
   ```

5. **`apps/platform/src/modules/plan-detail/components/session-card.tsx`** — drop 2 props from signature + drop 2 prop assignments on `<SessionLabelSelect>` call; remove `Label` import (kept only for `session.label: Label | null`-related usage — verify; if `Label` still referenced elsewhere, keep).

   **Final signature** (Phase 3 only — Phase 5 will further add BlockList):

   ```typescript
   type SessionCardProps = {
     session: SessionWithLabel;
     planId: string;
     startDate: string;
   };
   ```

   `<SessionLabelSelect>` call: drop `options={sessionLabelOptions}` + `isLoading={sessionLabelOptionsLoading}` assignments; keep `value` + `onChange`.

6. **`apps/platform/src/modules/plan-detail/components/day-label-select.tsx`** — switch from receiving `options/isLoading` props к internal `useLabelOptions("DAY")` hook. Drop `Label` import (kept if `Label | null` value-type still used).

   **Final shape**:

   ```typescript
   "use client";

   import type { Label } from "@repo/contracts/lms/label";
   import { LabelSelect } from "@repo/ui";

   import { useLabelOptions } from "@app/lib/hooks";

   type DayLabelSelectProps = {
     value: Label | null;
     onChange: (labelId: string | null) => void;
     disabled?: boolean | undefined;
   };

   export const DayLabelSelect = ({ value, onChange, disabled = false }: DayLabelSelectProps) => {
     const { options, isLoading } = useLabelOptions("DAY");

     return (
       <LabelSelect
         value={value}
         options={options}
         isLoading={isLoading}
         onChange={onChange}
         disabled={disabled}
         label="Day label"
         placeholder="Tag this day…"
       />
     );
   };
   ```

7. **`apps/platform/src/modules/plan-detail/components/session-label-select.tsx`** — identical pattern к DayLabelSelect, level "SESSION".

   **Final shape**:

   ```typescript
   "use client";

   import type { Label } from "@repo/contracts/lms/label";
   import { LabelSelect } from "@repo/ui";

   import { useLabelOptions } from "@app/lib/hooks";

   type SessionLabelSelectProps = {
     value: Label | null;
     onChange: (labelId: string | null) => void;
     disabled?: boolean | undefined;
   };

   export const SessionLabelSelect = ({ value, onChange, disabled = false }: SessionLabelSelectProps) => {
     const { options, isLoading } = useLabelOptions("SESSION");

     return (
       <LabelSelect
         value={value}
         options={options}
         isLoading={isLoading}
         onChange={onChange}
         disabled={disabled}
         label="Session label"
         placeholder="Tag this session…"
       />
     );
   };
   ```

**Atomicity check**: 7 files modified в same commit (1 view + 2 grid/row + 2 list/card + 2 label-select). Husky pre-commit `turbo check-types --filter="...[HEAD]"` runs ONCE on committed state — all signatures + callsites consistent → green. No intermediate broken tree.

**Commit (Phase 3)**:

- Subject: `refactor(platform): consume labeloptions context across day-row session-list day-label-select session-label-select`
- Body: documents drop of labelOptions/sessionLabelOptions prop drilling (4 levels × 2 categories = 8 prop removals); DayLabelSelect + SessionLabelSelect migrate к useLabelOptions internal hook; PlanDetailView wraps в LabelOptionsProvider.

### Phase 4 — 5 new Block components

**Files** (5 NEW):

1. **`apps/platform/src/modules/plan-detail/components/block-label-select.tsx`** — multi-mode wrapper over extended LabelSelect.

   **Final shape**:

   ```typescript
   "use client";

   import type { Label } from "@repo/contracts/lms/label";
   import { LabelSelect } from "@repo/ui";

   import { useLabelOptions } from "@app/lib/hooks";

   type BlockLabelSelectProps = {
     value: Label[];
     onChange: (labelIds: string[]) => void;
     disabled?: boolean | undefined;
   };

   export const BlockLabelSelect = ({ value, onChange, disabled = false }: BlockLabelSelectProps) => {
     const { options, isLoading } = useLabelOptions("BLOCK");

     return (
       <LabelSelect
         multiple
         value={value}
         options={options}
         isLoading={isLoading}
         onChange={onChange}
         disabled={disabled}
         label="Block labels"
         placeholder="Tag this block…"
       />
     );
   };
   ```

2. **`apps/platform/src/modules/plan-detail/components/block-notes-field.tsx`** — 4th `useBlurCommit` callsite, mirror SessionNotesField.

   **Final shape**:

   ```typescript
   "use client";

   import { TextField } from "@mui/material";

   import { BLOCK_CONSTANTS } from "@repo/contracts/lms/block";

   import { useBlurCommit } from "@app/lib/hooks";

   type BlockNotesFieldProps = {
     value: string | null;
     onCommit: (next: string | null) => void;
   };

   export const BlockNotesField = ({ value, onCommit }: BlockNotesFieldProps) => {
     const { draft, setDraft, handleFocus, handleBlur } = useBlurCommit({ value, onCommit });

     return (
       <TextField
         label="Block notes"
         placeholder="Notes for this block…"
         value={draft}
         onChange={(event) => setDraft(event.target.value)}
         onFocus={handleFocus}
         onBlur={handleBlur}
         multiline
         minRows={2}
         fullWidth
         size="small"
         inputProps={{ maxLength: BLOCK_CONSTANTS.MAX_NOTES_LENGTH }}
       />
     );
   };
   ```

3. **`apps/platform/src/modules/plan-detail/components/add-block-button.tsx`** — instant-create, mirror AddSessionButton.

   **Final shape**:

   ```typescript
   "use client";

   import AddIcon from "@mui/icons-material/Add";
   import { Button } from "@mui/material";

   import { useCreateBlock } from "@app/lib/hooks";

   type AddBlockButtonProps = {
     planId: string;
     startDate: string;
     sessionId: string;
   };

   export const AddBlockButton: React.FC<AddBlockButtonProps> = ({ planId, startDate, sessionId }) => {
     const createBlock = useCreateBlock(planId, startDate, sessionId);

     return (
       <Button
         onClick={() => createBlock.mutate({})}
         startIcon={<AddIcon />}
         disabled={createBlock.isPending}
         size="small"
         variant="outlined"
       >
         Add block
       </Button>
     );
   };
   ```

4. **`apps/platform/src/modules/plan-detail/components/block-card.tsx`** — mirror SessionCard pattern. **NO Intensity/TimeCap rendering** per OQ-e E2 (Step 7.5 owns both edit + read display together).

   **Final shape**:

   ```typescript
   "use client";

   import { useRef, useState } from "react";

   import { useSortable } from "@dnd-kit/sortable";
   import { CSS } from "@dnd-kit/utilities";
   import DeleteIcon from "@mui/icons-material/Delete";
   import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
   import MoreVertIcon from "@mui/icons-material/MoreVert";
   import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack } from "@mui/material";

   import type { Block } from "@repo/contracts/lms/block";
   import { ConfirmationModal } from "@repo/ui";

   import { useAssignBlockLabels, useDeleteBlock, useUpdateBlock } from "@app/lib/hooks";

   import { BlockLabelSelect } from "./block-label-select";
   import { BlockNotesField } from "./block-notes-field";

   type BlockCardProps = {
     block: Block;
     planId: string;
     startDate: string;
   };

   export const BlockCard: React.FC<BlockCardProps> = ({ block, planId, startDate }) => {
     const updateBlock = useUpdateBlock(planId, startDate);
     const deleteBlock = useDeleteBlock(planId, startDate);
     const assignLabels = useAssignBlockLabels(planId, startDate);

     const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
       id: block.id,
       disabled: updateBlock.isPending || deleteBlock.isPending || assignLabels.isPending,
     });

     const [menuOpen, setMenuOpen] = useState(false);
     const [deleteOpen, setDeleteOpen] = useState(false);
     const anchorRef = useRef<HTMLButtonElement>(null);

     const handleLabelsChange = (labelIds: string[]) =>
       assignLabels.mutate({ blockId: block.id, data: { labelIds } });

     const handleNotesCommit = (notes: string | null) =>
       updateBlock.mutate({ blockId: block.id, data: { notes } });

     const handleDeleteConfirm = () => {
       deleteBlock.mutate({ blockId: block.id }, { onSuccess: () => setDeleteOpen(false) });
     };

     const style = {
       transform: CSS.Transform.toString(transform),
       transition,
       opacity: isDragging ? 0.5 : 1,
     };

     return (
       <Box
         ref={setNodeRef}
         style={style}
         sx={{
           p: 1.5,
           border: 1,
           borderColor: "divider",
           borderRadius: 1,
           bgcolor: "background.default",
         }}
       >
         <Stack direction="row" spacing={1.5} alignItems="flex-start">
           <IconButton
             {...attributes}
             {...listeners}
             size="small"
             aria-label="Drag block"
             sx={{ cursor: "grab", touchAction: "none" }}
           >
             <DragIndicatorIcon fontSize="small" />
           </IconButton>

           <Box sx={{ width: 240, flexShrink: 0 }}>
             <BlockLabelSelect value={block.labels} onChange={handleLabelsChange} />
           </Box>

           <Box sx={{ flex: 1, minWidth: 0 }}>
             <BlockNotesField value={block.notes} onCommit={handleNotesCommit} />
           </Box>

           <IconButton
             ref={anchorRef}
             onClick={() => setMenuOpen(true)}
             aria-label="Block actions"
             size="small"
           >
             <MoreVertIcon fontSize="small" />
           </IconButton>
         </Stack>

         <Menu anchorEl={anchorRef.current} open={menuOpen} onClose={() => setMenuOpen(false)}>
           <MenuItem
             onClick={() => {
               setMenuOpen(false);
               setDeleteOpen(true);
             }}
             sx={{ color: "error.main" }}
           >
             <ListItemIcon sx={{ color: "inherit" }}>
               <DeleteIcon fontSize="small" />
             </ListItemIcon>
             <ListItemText>Delete</ListItemText>
           </MenuItem>
         </Menu>

         <ConfirmationModal
           open={deleteOpen}
           onClose={() => setDeleteOpen(false)}
           title="Delete block"
           type="danger"
           message="Delete this block?"
           details={block.labels.length > 0 ? block.labels.map((l) => l.name).join(", ") : "Empty block"}
           onConfirm={handleDeleteConfirm}
           isConfirming={deleteBlock.isPending}
         />
       </Box>
     );
   };
   ```

   **Note on `bgcolor`**: BlockCard uses `bgcolor: "background.default"` (slight contrast vs SessionCard's `"background.paper"` to visually distinguish nesting). Verify theme palette supports both at execution; if `background.default` unavailable, fallback к `"background.paper"` с inner border.

5. **`apps/platform/src/modules/plan-detail/components/block-list.tsx`** — mirror SessionList с dnd-kit. **NO `sessionLabelOptions` chain** (BlockLabelSelect uses Context).

   **Final shape**:

   ```typescript
   "use client";

   import { useEffect, useState } from "react";

   import {
     closestCenter,
     DndContext,
     KeyboardSensor,
     PointerSensor,
     useSensor,
     useSensors,
     type DragEndEvent,
   } from "@dnd-kit/core";
   import {
     arrayMove,
     SortableContext,
     sortableKeyboardCoordinates,
     verticalListSortingStrategy,
   } from "@dnd-kit/sortable";
   import { Box, Stack } from "@mui/material";

   import type { Block } from "@repo/contracts/lms/block";

   import { useReorderBlocks } from "@app/lib/hooks";

   import { AddBlockButton } from "./add-block-button";
   import { BlockCard } from "./block-card";

   type BlockListProps = {
     planId: string;
     startDate: string;
     sessionId: string;
     blocks: Block[];
   };

   export const BlockList: React.FC<BlockListProps> = ({ planId, startDate, sessionId, blocks }) => {
     const reorderBlocks = useReorderBlocks(planId, startDate, sessionId);
     const [sortedBlocks, setSortedBlocks] = useState<Block[]>(blocks);

     useEffect(() => {
       setSortedBlocks(blocks);
     }, [blocks]);

     const sensors = useSensors(
       useSensor(PointerSensor),
       useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
     );

     const handleDragEnd = (event: DragEndEvent) => {
       const { active, over } = event;

       if (!over || active.id === over.id) {
         return;
       }

       const oldIndex = sortedBlocks.findIndex((b) => b.id === active.id);
       const newIndex = sortedBlocks.findIndex((b) => b.id === over.id);

       if (oldIndex < 0 || newIndex < 0) {
         return;
       }

       const previousOrder = sortedBlocks;
       const nextOrder = arrayMove(sortedBlocks, oldIndex, newIndex);

       setSortedBlocks(nextOrder);
       reorderBlocks.mutate(
         { orderedIds: nextOrder.map((b) => b.id) },
         {
           onError: () => setSortedBlocks(previousOrder),
         },
       );
     };

     return (
       <Stack spacing={1}>
         {sortedBlocks.length > 0 ? (
           <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
             <SortableContext
               items={sortedBlocks.map((b) => b.id)}
               strategy={verticalListSortingStrategy}
             >
               <Stack spacing={1}>
                 {sortedBlocks.map((block) => (
                   <BlockCard key={block.id} block={block} planId={planId} startDate={startDate} />
                 ))}
               </Stack>
             </SortableContext>
           </DndContext>
         ) : null}

         <Box>
           <AddBlockButton planId={planId} startDate={startDate} sessionId={sessionId} />
         </Box>
       </Stack>
     );
   };
   ```

   **Cross-Session isolation**: `SortableContext` instance per BlockList = per Session. Block dragged within BlockList stays within Session boundary; coach can't drag Block from Session A к Session B (different SortableContext + different reorder API path).

**Update barrel `apps/platform/src/modules/plan-detail/components/index.ts`** (Phase 4 also touches this):

```typescript
export { AddBlockButton } from "./add-block-button";
export { AddSessionButton } from "./add-session-button";
export { BlockCard } from "./block-card";
export { BlockLabelSelect } from "./block-label-select";
export { BlockList } from "./block-list";
export { BlockNotesField } from "./block-notes-field";
export { DayLabelSelect } from "./day-label-select";
export { DayNotesField } from "./day-notes-field";
export { DayRow } from "./day-row";
export { SessionCard } from "./session-card";
export { SessionLabelSelect } from "./session-label-select";
export { SessionList } from "./session-list";
export { SessionNotesField } from "./session-notes-field";
export { WeekGrid } from "./week-grid";
export { WeekNavigator } from "./week-navigator";
export { WeekNotes } from "./week-notes";
```

**Commit (Phase 4)**:

- Subject: `feat(platform): add block list block card add button block label select block notes field components`
- Body: documents 5 new components (BlockList + BlockCard + AddBlockButton + BlockLabelSelect + BlockNotesField) + barrel additions; mirrors Step 6.7 Session UI pattern with multi-label, no Intensity/TimeCap (Step 7.5 scope); 4th useBlurCommit callsite.

### Phase 5 — Integrate BlockList в SessionCard

**File**: `apps/platform/src/modules/plan-detail/components/session-card.tsx`

**Change**: add `<BlockList session={session} planId={planId} startDate={startDate} />` inside SessionCard's outer `<Box>`, **after** the `<Stack direction="row">` (kebab row) but **before** `<Menu>` (kebab menu — but Menu is portal-rendered, position doesn't matter; place BlockList после `</Stack>` для logical reading order).

**Final shape excerpt** (Phase 5 deltas only — assumes Phase 3 already dropped `sessionLabelOptions` props):

```typescript
// ... imports updated to include BlockList ...
import { BlockList } from "./block-list";

export const SessionCard: React.FC<SessionCardProps> = ({ session, planId, startDate }) => {
  // ... existing hooks + handlers unchanged ...

  return (
    <Box ref={setNodeRef} style={style} sx={{ ... }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        {/* DragHandle + SessionLabelSelect + SessionNotesField + Kebab — unchanged */}
      </Stack>

      <BlockList
        planId={planId}
        startDate={startDate}
        sessionId={session.id}
        blocks={session.blocks}
      />

      <Menu ...> {/* unchanged */}
      </Menu>

      <ConfirmationModal ...> {/* unchanged */}
    </Box>
  );
};
```

**Layout consideration**: BlockList renders within SessionCard `<Box>`. Stack spacing not explicit here; verify visual hierarchy at smoke-test — if BlockList feels cramped, add `<Box sx={{ pt: 1.5 }}>` wrapper or adjust SessionCard `Stack` spacing. Defer styling tweaks to smoke-test feedback.

**Commit (Phase 5)**:

- Subject: `feat(platform): integrate blocklist into sessioncard with embedded session blocks data`
- Body: documents BlockList integration consuming session.blocks (Step 7.3.5 embed); SessionCard signature unchanged from Phase 3; first Block UI visible end-to-end.

---

## § 4. Acceptance criteria (must self-check in `output.md`)

### Phase 1 — @repo/ui LabelSelect extension

1. `packages/ui/src/components/label-select/index.tsx` exports discriminated union `LabelSelectProps` supporting `multiple?: false | undefined` (single) и `multiple: true` (multi) variants.
2. Internal runtime branch `if (props.multiple === true)` switches between `Autocomplete<Label, true>` and `Autocomplete<Label, false>` rendering.
3. `getOptionLabel` + `isOptionEqualToValue` + `renderInput` extracted к outer scope (reused across branches).
4. Existing DayLabelSelect + SessionLabelSelect callsites unchanged (default-false branch preserves API).

### Phase 2 — Context Provider + hook

5. `apps/platform/src/lib/contexts/label-options-provider.tsx` created — exports `LabelOptionsProvider` component + `LabelOptionsContext` + types.
6. `apps/platform/src/lib/contexts/index.ts` created — barrel exports.
7. `apps/platform/src/lib/hooks/use-label-options.ts` created — exports `useLabelOptions(level)` hook; throws if outside Provider.
8. `apps/platform/src/lib/hooks/index.ts` adds alphabetic `export * from "./use-label-options"`.
9. `apps/platform/src/lib/index.ts` adds `export * from "./contexts"` if such root barrel exists (verify at execution; create если missing).
10. Provider internal: 3x `useLabelSearch` calls (DAY + SESSION + BLOCK); single-flight per TanStack cache key.

### Phase 3 — Component refactor (atomic)

11. `plan-detail-view.tsx` wraps children в `<LabelOptionsProvider>`; drops 2 `useLabelSearch` calls + their `useLabelSearch` import; drops 4 prop assignments from `<WeekGrid>`.
12. `week-grid.tsx` signature drops 4 label props (final 3 props: planId/monday/days); drops 4 prop assignments on `<DayRow>`; removes unused `Label` import.
13. `day-row.tsx` signature drops 4 label props (final 7 props: date/planId/startDate/dayOfWeek/label/notes/sessions); drops options/isLoading from `<DayLabelSelect>` and sessionLabelOptions/sessionLabelOptionsLoading from `<SessionList>`.
14. `session-list.tsx` signature drops 2 props (final 4 props: planId/startDate/dayOfWeek/sessions); drops 2 prop assignments on `<SessionCard>`; removes `Label` import.
15. `session-card.tsx` signature drops 2 props (Phase 3 final: 3 props session/planId/startDate); drops options/isLoading from `<SessionLabelSelect>`; `Label` import dropped if no longer referenced.
16. `day-label-select.tsx` drops `options/isLoading` from signature; internal `useLabelOptions("DAY")` consumes Context.
17. `session-label-select.tsx` drops `options/isLoading` from signature; internal `useLabelOptions("SESSION")` consumes Context.

### Phase 4 — 5 new Block components

18. `block-label-select.tsx` created — multi-mode wrapper; takes `{value: Label[], onChange: (string[]) => void}`; internal `useLabelOptions("BLOCK")` + `<LabelSelect multiple>`.
19. `block-notes-field.tsx` created — 4th `useBlurCommit` callsite; uses `BLOCK_CONSTANTS.MAX_NOTES_LENGTH`.
20. `add-block-button.tsx` created — instant-create via `useCreateBlock(planId, startDate, sessionId).mutate({})`; signature: `{planId, startDate, sessionId}` (no DayOfWeek per Block URL design).
21. `block-card.tsx` created — mirror SessionCard pattern (dnd-kit useSortable + drag-handle + LabelSelect + NotesField + kebab Menu → ConfirmationModal Delete); NO Intensity/TimeCap rendering (E2 ratified — Step 7.5 owns both edit + read).
22. `block-list.tsx` created — mirror SessionList pattern (DndContext + SortableContext + optimistic sortedBlocks + rollback + useEffect resync); per-Session SortableContext boundary enforces cross-Session isolation.
23. `components/index.ts` barrel +5 explicit named exports (alphabetic).

### Phase 5 — Integration

24. `session-card.tsx` renders `<BlockList session={session} planId={planId} startDate={startDate} />` inside outer Box, after kebab row Stack, before Menu/ConfirmationModal.

### Global verifications

25. `pnpm check-types` 16/16 OK (no new TS errors; discriminated union compiles clean).
26. `pnpm lint` 16/16 OK, 0 warnings.
27. `pnpm test` 1075/1075 (baseline unchanged; UI components не unit-tested per `[[no-tech-debt-in-mocks]]`).
28. `pnpm dep:check` 0 violations / 1180-1185 modules (+5-10 new files exact match — verify at execution; +5 Block components + 2 new Context files + 0 reduction = ~7 new modules).
29. Browser smoke 18-20 scenario steps green (see § 10).
30. Single atomic per-layer commit per phase = 5 total docs commits (Phases 1-5); Husky pre-commit + commit-msg + pre-push clean всех без `--no-verify`.
31. All 5 commit subjects lowercase + ≤100 chars (use `-m` flags для multi-paragraph bodies per Step 7.3.6 D-4 lesson).
32. Zero § 0 verbatim quote drift; zero § 0.A grep enumeration surprises (extras Read-cleared OR escalated via AskUserQuestion).

---

## § 5. Adversarial pass (7 axes per `[[planner-adversarial-review]]`)

### Axis 1 — Drag-handle a11y

Per Step 6.7 D-4 dnd-kit idiom: `cursor: "grab", touchAction: "none"` on IconButton wrapping `<DragIndicatorIcon>`. `aria-label="Drag block"`. Mirror SessionCard verbatim. Pointer + Keyboard sensors per SessionList. No regression.

### Axis 2 — Optimistic local sort + rollback

`sortedBlocks` local state mirror SessionList; `useEffect([blocks])` resync when server data changes; `onError: setSortedBlocks(previousOrder)` rollback on reorder mutation failure. Test scenario: drag Block, simulate network failure → UI snaps back к previous order. Mirror SessionList D-1 pattern.

### Axis 3 — Empty state instant-create

First Block on empty Session: `useCreateBlock(planId, startDate, sessionId).mutate({})` — empty payload; server applies `{intensity:null, timeCap:null, notes:null, order=max+10, labels:[]}` defaults per Step 7.1. UI shows new BlockCard immediately после mutation success (via TanStack invalidate → useWeek refetch → session.blocks updates). No client-side optimistic Block stub.

### Axis 4 — Multi-Label widget UX + clear-all

`BlockLabelSelect` extends MUI Autocomplete `multiple={true}`. Selected labels render as `Chip[]` (MUI default for multi-Autocomplete). Each Chip has X icon to remove individual label. **Empty array = clear-all** per Step 7.0 D-7 `assignBlockLabelsSchema.labelIds.min(0)`: removing last Chip OR explicit "clear all" sends `{labelIds: []}` → server tx delete-all + zero insert. UI must not block empty-array submission. Coach can also reach empty state by removing all Chips one-by-one.

### Axis 5 — Context refactor regression risk

Phase 3 touches 7 files atomically. Verify post-refactor that WeekNotes/DayNotesField/SessionNotesField/DayLabelSelect/SessionLabelSelect all still work end-to-end:

- DAY label preload via Context (was via prop) — should remain transparent to user.
- SESSION label preload via Context — same.
- Cache keys distinct по level → 3 independent GET requests on first mount → reused thereafter.
- Browser smoke step 3 (label preload trace per Step 6.4 ratified UX) — verify Network panel shows 3 distinct `/api/platform/labels/search?level=...` calls с status 200.

### Axis 6 — Cross-Session BlockList isolation

Block reorder scoped к single Session (mirror Step 6.1 Session reorder cross-Day constraint per server `verifyBlockOwnership` chain). `SortableContext` per BlockList = per Session instance — drag operations bounded by Session container; coach physically cannot drag Block from Session A к Session B (different SortableContext, no dnd cross-talk). Server-side defense-in-depth: `lmsBlockApi.reorder` rejects foreign sessionId per Step 7.1 case 8 invariant.

### Axis 7 — Step 7.3.6 reorder two-pass interaction

Block reorder via UI triggers `lmsBlockApi.reorder` two-pass UPDATE (negative-staging → final positions per Step 7.3.6 D-2 scope expansion). End-to-end smoke verifies reorder happy-path works: UI drag → `useReorderBlocks.mutate({orderedIds: [...]})` → server array-form `prisma.$transaction([...phase1, ...phase2])` → response → TanStack invalidate → UI re-render with new order. Stress: rapid sequential reorders (drag-drop-drag-drop) — verify each completes cleanly без P2002 surface (prior reorder commits before next starts; intermediate negative state не persisted).

**8th flavour applicability**: `[[planner-mutation-invariant-trace]]` NOT triggered — Step 7.4 doesn't touch schema constraints. Reserved для QA-001b (Session @@unique) future step.

---

## § 6. Open questions ratifications (already locked at thesis cycle 2026-05-18)

All 10 OQ (a-g + h/i/j) ratified by user per planner thesis:

- **(a)** Verbatim reads — confirmed via 15 § 0 quote sections + 10 grep enumerations.
- **(b)** BlockLabelSelect = B1 extend `@repo/ui/LabelSelect` с discriminated union (NOT B2 fork; cohesion > duplication; ~30-40 LOC extension).
- **(c)** Context refactor = C1 full LabelOptionsContext at PlanDetailView (NOT C2 BlockLabelContext-only half-measure; bundled с BlockList atomic per single-concern hygiene).
- **(d)** BlockCard scope = D1 full mirror SessionCard (NOT D2 narrow; reorder API + hook shipped Step 7.1 + 7.3, consumer must arrive here).
- **(e)** Intensity + TimeCap rendering = E2 strict skip until Step 7.5 (NOT E1 full display, NOT E1.5 indicator; Step 7.5 owns both edit + consistent read).
- **(f)** `useBlurCommit` 4th callsite = trivial wrapper mirror SessionNotesField verbatim (BLOCK_CONSTANTS swap).
- **(g)** Adversarial pass = 7 axes including NEW Axis 7 (Step 7.3.6 reorder two-pass interaction).
- **(h)** Smoke depth = deep ~18-20 step scenario per `[[training-domain-validation-gate]]` validation confidence.
- **(i)** Commit strategy = 5 per-layer atomic (no squash; mirror Step 6.7 5-commit pattern).
- **(j)** Smoke pre-condition = manual admin-create 2-3 BLOCK labels (NOT seed; per D4 labels are library coach-populated).

NO new escalations expected at execution time. If anything surfaces (e.g., grep produces unexpected hits в § 0.A; verbatim drift в § 0.1-0.15; BLOCK_CONSTANTS not defined per assumption) — STOP, surface via `AskUserQuestion` with hypothesis.

---

## § 7. Commit strategy (5 per-layer atomic per `[[husky-cross-package-squash]]` pre-check)

**Pre-check** (verbatim § 0.B + § 0.C):

- `.husky/pre-commit` runs `pnpm turbo run check-types --filter="...[HEAD]"` per commit.
- `turbo.json` `check-types: dependsOn: ["^check-types"]` propagates.
- Phase 1 touches `@repo/ui` → fan-out к `apps/{admin,platform,marketing}` через barrel re-export. **Default-false multi prop = additive** → no breaking change → fan-out check-types green.
- Phases 2-5 touch only `apps/platform/` → fan-out limited к platform itself.
- All 5 commits independently pass check-types — no squash required.

**5 commits**:

1. **Phase 1**: `feat(ui): extend labelselect with multi-mode discriminated union` (62 chars)
   - Body: discriminated union pattern + multi prop + zero-breaking-change default-false + MUI Autocomplete boolean variance.
2. **Phase 2**: `feat(platform): add labeloptionsprovider context with day session block preload` (78 chars)
   - Body: new lib/contexts/ folder + Provider component (3x useLabelSearch) + useLabelOptions hook + barrel additions.
3. **Phase 3**: `refactor(platform): consume labeloptions context across day-row session-list day-label-select session-label-select` (114 chars — **OVER 100 chars; need shortening!**)
   - **Refined**: `refactor(platform): migrate day session label-select callsites to labeloptions context` (87 chars)
   - Body: drops labelOptions/sessionLabelOptions prop drill across plan-detail-view + week-grid + day-row + session-list + session-card; DayLabelSelect + SessionLabelSelect migrate к useLabelOptions internal hook.
4. **Phase 4**: `feat(platform): add block list block card add button block label select block notes field components` (99 chars)
   - **Verify char count** at execution; if over 100, shorten к `feat(platform): add block list card add-button label-select notes-field components` (82 chars).
   - Body: 5 new components (BlockList + BlockCard + AddBlockButton + BlockLabelSelect + BlockNotesField) + barrel additions; mirrors Step 6.7 Session UI pattern with multi-label, no Intensity/TimeCap (Step 7.5 scope); 4th useBlurCommit callsite.
5. **Phase 5**: `feat(platform): integrate blocklist into sessioncard with embedded session blocks data` (88 chars)
   - Body: BlockList integration consuming session.blocks (Step 7.3.5 embed); SessionCard signature unchanged from Phase 3; first Block UI visible end-to-end.

**Stage by explicit names** (per `[[no-db-creds-in-settings-local]]` hygiene — NEVER `git add -A` / `git add .`). Each commit stages only files in its phase scope.

**Commit body convention** (per Step 7.3.6 D-4 lesson): use 4-7 `-m` flags для multi-paragraph bodies. Each paragraph ≤100 chars universally safe; avoid HEREDOC unless body is single short paragraph.

**Pre-push hook** (`pnpm dep:check` + `turbo run lint check-types --filter="...[origin/main]"`) runs once on push — verify all 5 commits collectively green. Push deferred per `[[training-domain-validation-gate]]` (Step 7.4 + 7.5 batch).

---

## § 8. Out of scope

- **Intensity + TimeCap UI rendering** — Step 7.5 ratified scope (form-driven; consume Step 7.0 D-2 pre-shipped `as const` tuples + standalone `rpeSchema`/`paceSchema` affordances).
- **Schema editor** — Step 8 (Archetype picker + archetypeParams form per archetype).
- **SchemaRow editor** — Step 9 (per-rowKind forms; shared Load/RepNotation/Intensity/Tempo/Side/Media composites).
- **Coach validation gate logic** — happens AFTER Step 7.5 close-out per `[[training-domain-validation-gate]]`.
- **Seed BLOCK-level labels** — per D4 (Labels = library, coach-populated). Smoke pre-condition: manual admin-create 2-3 BLOCK labels.
- **Symbol rename `cms{Label,Exercise}AdminApi` → `lms*`** — Step 6.1.5 deferred carry-forward (low priority).
- **DAY_INCLUDE hoist к shared module** — Step 8 trigger (Schema entity adds another DaySlot consumer).
- **BLOCK_WITH_LABELS_INCLUDE hoist** — Step 8 trigger.
- **mapToBlockWithSchemas mapper** — Step 8 (Schema entity).
- **QA-001b Session @@unique constraint + reorder two-pass** — separate future step per H1 ratification (Step 7.3.6 strict scope).
- **QA-001c retryOnP2034 widening к P2002** — separate future step.
- **WORKFLOW-001 db:seed vs tests convention** — separate workflow concern.
- **Step 7.4 dedicated UI tests** — per `[[no-tech-debt-in-mocks]]`, UI smoke-tested via browser scenario (§ 10); no Vitest UI test files added.

---

## § 9. Carry-forwards to record в `output.md`

**Pre-existing 9 from Step 7.3.6 unchanged**:

- QA-001b — Session @@unique([dayId, order]) mirror constraint + Session.reorder two-pass.
- QA-001c — retryOnP2034 widening к P2002 on \_max+N insert pattern.
- WORKFLOW-001 — db:seed vs test suite incompatibility through idx_single_head_coach.
- DAY_INCLUDE hoist к shared endpoints/lms/\_shared/day-include.ts (Step 8 trigger).
- BLOCK_WITH_LABELS_INCLUDE hoist к shared module (Step 8 trigger).
- mapToBlockWithSchemas mapper (Step 8 — Schema entity).
- Symbol rename cms{Label,Exercise}AdminApi → lms\* (Step 6.1.5 deferred, low priority).
- QA-006 HEAD_COACH + ARCHIVED composition test (INFO, optional).
- QA-019 D-7 invariant outcome-only test (accepted per [[no-tech-debt-in-mocks]]).
- QA-022 TxClient Omit deny-list fragile к Prisma upgrades (flag для /upgrade @prisma/client prompts).

**NEW** (only if surfaced at execution time):

- Any unforeseen Context regression OR multi-mode TS variance complexity OR @repo/ui extension downstream impact discovered during execution.

**CLOSED по Step 7.4**:

- Step 7.3 R1 — useLabelSearch({level:"BLOCK"}) 3rd callsite — landed в LabelOptionsProvider Phase 2.
- Step 6.6/6.7 React Context для label preload trigger — materialized + resolved via Phase 2 + Phase 3.
- Step 6.7 useBlurCommit 4th callsite trigger — materialized в Phase 4 BlockNotesField.
- Step 7 OQ-3 — BlockLabelMulti widget shape — resolved via B1 extend LabelSelect (Phase 1).

---

## § 10. Smoke-test scenario (~18-20 steps per OQ-h deep validation per `[[training-domain-validation-gate]]`)

### Preconditions

1. DB reset + seed: `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed`.
2. Dev server: `pnpm dev` (all 4 apps; platform on `:3001`, admin on `:3002`).
3. Login as coach: `[seed coach credentials per packages/api-server/prisma/seed.ts]` (verify exact email/password at smoke time).
4. **Manual admin pre-condition** (per OQ-j ratified): navigate to `localhost:3002/labels` → create 3 BLOCK-level labels: `Warm-up` (applicableLevels: [BLOCK]), `Working sets` (applicableLevels: [BLOCK]), `Cooldown` (applicableLevels: [BLOCK]). Save each. Verify all 3 appear in list.
5. **Re-reset DB without seed if test suite ran during dev**: `pnpm --filter @repo/api-server db:reset` (per Step 7.3.6 D-3 — `idx_single_head_coach` interferes если seed creates HEAD_COACH + test created another). For smoke-only flow, seed + admin preconditions are OK.

### Scenario steps

1. Navigate к `localhost:3001/coach/plans` → click an active training plan (seeded `Active Plan 1` per seed.ts) → landing on plan-detail.
2. **Verify label preload trace** (per OQ-c Context refactor verification): open browser DevTools Network tab; reload page; confirm 3 distinct GET requests fire: `/api/platform/labels/search?level=DAY`, `/api/platform/labels/search?level=SESSION`, `/api/platform/labels/search?level=BLOCK` — all status 200. Verify response bodies contain expected labels (DAY labels from prior admin work + SESSION labels + 3 fresh BLOCK labels from precondition).
3. **Verify existing Day + Session UI intact post-refactor** (Phase 3 regression check): on first row (Monday OR today's row если current week), click Day label Autocomplete → see DAY labels populated (no loading spinner stuck) → close без selecting. Click Day notes field → type "test note" → blur → verify saved (refetch or check via API).
4. **Verify SessionList works**: на same row, click "+ Add session" → empty SessionCard appears с drag handle + Session label Autocomplete + notes field + kebab. Click Session label → SESSION labels populated. Select one → Chip shows label name. Click notes → type → blur → saved.
5. **Block creation flow**: inside SessionCard (just created), click "+ Add block" — first empty BlockCard appears с drag handle + Block labels Autocomplete (multi-mode visible by multi-select chip layout) + Block notes field + kebab.
6. **Multi-label single chip**: click Block labels Autocomplete → see 3 BLOCK labels (`Warm-up` / `Working sets` / `Cooldown`) populated → select `Warm-up` → Chip appears с label name + X icon → close dropdown.
7. **Multi-label add 2nd chip**: click Autocomplete again → select `Working sets` → 2 Chips visible (`Warm-up` + `Working sets`); both have X icons.
8. **Multi-label remove via X**: click X on `Warm-up` Chip → Chip removed → only `Working sets` remains → verify saved (refetch or check API: assignBlockLabels mutation fired with `{labelIds: [<workingSetsId>]}`).
9. **Multi-label clear-all**: click X on `Working sets` Chip (last remaining) → 0 Chips → verify saved (`{labelIds: []}` per Step 7.0 D-7 empty-array-valid).
10. **Block notes blur-commit**: click Block notes field → type "Easy spin 10 min" → blur → verify saved (refetch or API check `updateBlock` mutation fired). Re-focus → type more → blur → verify second update.
11. **Add 2nd Block**: click "+ Add block" → 2nd empty BlockCard appears below 1st (order=20). Label as `Working sets` (1 chip). Notes "5×5 back squat".
12. **Add 3rd Block**: "+ Add block" → 3rd BlockCard. Label as `Cooldown`. Notes "Light stretch".
13. **Drag-reorder happy path**: drag 3rd Block (Cooldown) к top (above Warm-up... wait, 1st is now empty after step 9 clear; адjust). Verify drag-handle cursor changes to grab; verify drag preview follows mouse; release → new order visible in UI immediately (optimistic local sort); confirm после ~500ms server commits (via Network reorder request). F5 (reload) → verify new order persists (server stored).
14. **Drag-reorder swap pattern** (Step 7.3.6 D-2 verification): swap Block 2 and Block 3 by dragging Block 2 к position 3 → verify smooth completion (two-pass UPDATE pattern handles intermediate state gracefully — coach should see zero "constraint violation" error). F5 → order persists.
15. **Cross-Session isolation check**: add 2nd Session к same Day ("+ Add session" в SessionList). Verify can't drag Block from Session 1 к Session 2 (drag preview shows Block visually but drop target outside Session 1's SortableContext returns Block к original Session). No data corruption.
16. **Block delete via kebab → ConfirmationModal**: click kebab on Block 3 → "Delete" appears red → click Delete → ConfirmationModal opens с "Delete this block?" + details (label names OR "Empty block"). Click "Delete" red button → Block removed. F5 → confirms deletion persisted.
17. **Block delete via kebab — cancel path**: click kebab on Block 2 → Delete → ConfirmationModal opens → click "Cancel" → modal closes → Block intact.
18. **Network-offline graceful degrade**: DevTools Network tab → Throttling → "Offline". Try to add a Block → button shows pending state → request fails → toast error "Failed to create block". Block doesn't appear (no optimistic). Restore Online → can add successfully.
19. **Week navigation cache preservation**: click "Prev week" → empty week visible (per Step 6.6 calendar pattern). Click "Next week" 2x → returns to populated week → Blocks still visible (TanStack cache served from `useWeek` previous data). Label Autocomplete на DAY/SESSION/BLOCK не triggers extra fetches (Context cached).
20. **Final state check**: F5 → verify all changes persist (1 Day с 2 Sessions; Session 1 has 2 Blocks с labels/notes; Session 2 empty OR populated per scenario; SortableContext shows correct order).

### Rollback

After smoke complete: `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed` returns DB к clean seeded state. Smoke artifacts (created plans/days/sessions/blocks/labels) wiped. Manual: nothing persistent на client side beyond TanStack cache (page reload clears).

### Scenario PASS criteria

All 20 steps work as described; zero unexpected errors in console; zero unexpected toast errors; UI visual hierarchy reasonable (Blocks visually distinguishable from Sessions; drag handles obvious; ConfirmationModal copy clear); Network panel shows expected request patterns (3 label preload requests on mount; mutations fire on each Block create/update/delete/reorder/assignLabels; reorder two-pass invisible к client — single mutation request).

---

## § 11. `output.md` structure (executor produces per WORKFLOW.md § "output.md format")

```markdown
## Что сделано

<3-5 line summary + Phase-by-Phase status>

## Изменённые/созданные файлы

<table with LOC counts per Phase>

## Принятые решения

<D-1, D-2, ... — each minor justification with rationale>

## Возникшие вопросы и как решены

<any § 0 escalations OR none — per Step 7.3.5 + 7.3.6 escalation patterns>

## Что отложено

<carry-forwards per § 9 above>

## Ссылка на `.feature-dev/<ts>/`

`.feature-dev/<ts>/` — research.md + design.md + plan.md + review.md + qa.md (full pipeline)

## Сценарий смоук-теста

<reference to § 10 + executor confirms 20/20 PASS OR enumerates any deviations>

## Verification notes

<verbatim console output for each Phase 5 command + each Phase commit landing>

## Acceptance criteria self-check

<32 numbered points per § 4 above, each ✓ or ✗ with rationale>
```

---

## Final reminder — planner discipline (per 8-flavour checklist в WORKFLOW.md "Lessons learned")

- Every change traceable к either § 0 verbatim quote OR ratified OQ в § 6.
- No instinct-engineering — out of scope = deferred carry-forward, NOT silent expansion.
- Every § 0 verbatim quote re-Read at execution time; any drift → STOP + `AskUserQuestion`.
- § 0.A grep enumeration MUST run pre-Phase-1; any unexpected hit → STOP + surface.
- Phase 3 atomicity critical: refactor producer + all consumers в same commit, NO mid-commit broken state.
- Phase 4 BlockCard explicitly NOT rendering Intensity/TimeCap (E2 ratified) — coach validation gate sees structural Block UI without premature visualization commitment.
- Browser smoke 20-step scenario verifies Step 7.3.6 two-pass reorder invariant works end-to-end via UI consumer (Axis 7).
- 5 `-m` flag commit bodies preferred over HEREDOC (per Step 7.3.6 D-4 lesson — em-dash footer-split trap).
- Husky hooks never bypassed; commit-msg blocks Cyrillic via check-en-only.sh — body всегда English.
- 8th flavour `[[planner-mutation-invariant-trace]]` NOT applicable here (no schema constraints); reserved для QA-001b.

**Правильное решение важнее времени и усилий.**
