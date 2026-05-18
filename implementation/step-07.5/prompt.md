# Step 7.5 — Intensity + TimeCap UI composites (BlockEditorModal + per-dim fields + Chip-row read display)

> Eighth sub-step of Step 7 decomposition (7.0 contracts → 7.1 api-server → 7.2 routes → 7.3 client hooks → 7.3.5 read-embed → 7.3.6 schema constraint → 7.4 UI BlockList + Context refactor → **7.5 Intensity + TimeCap UI**). **LAST code commit before coach validation pause** per `[[training-domain-validation-gate]]`; user pre-committed to **Option 1 (full Step 8 Schema editor)** at thesis 2026-05-18 — middle/full-drop options removed from active queue.
>
> Scope: ship both EDIT form (FormModal-driven RHF + zodResolver) AND consistent READ display (Chip-row) in same step per E2 commitment from Step 7.4. Consumes Step 7.0 D-2 pre-shipped affordances in `packages/contracts/src/entities/lms/_shared/{intensity,time-cap}.ts` (5 standalone Zod sub-schemas + 4 `as const` tuples).

## Execution mode

- **Pipeline**: `/feature` **full** (multi-file UI surface; 4 atomic per-layer code commits; cross-package extension NOT anticipated; pure platform changes). Mirror Step 7.4 precedent — first `/feature` full pipeline in Step 7.x.
- **Branch override (mandatory per `[[always-via-feature-skill]]`)**: stay on `feat/training-domain`. **DO NOT cut a new `feat/<slug>` branch**. The `/feature` skill default behavior of cutting a fresh branch is overridden here because the training-domain workflow uses a single long-lived branch per `[[training-domain-workflow]]` convention. If `/feature` Stage 0 prompts to cut a branch — refuse and stay on `feat/training-domain`.
- **STOP-and-surface protocol obligatory** per `WORKFLOW.md` § Forbidden #4 + Obligatory #1+#3. Any verbatim drift in § 0 quotes vs HEAD, any planner-spec ambiguity, any executor judgment call beyond "minor adjacent refinement" — `AskUserQuestion` with hypothesis, do NOT silently comply.
- **Hooks**: never `--no-verify` / `--no-edit` / `--no-gpg-sign`. If pre-commit / pre-push / commit-msg fails — investigate root cause + fix; surface to planner if non-obvious.
- **Commitlint**: subject ≤ 100 chars, fully lowercase (acronyms too — `blockeditor` not `BlockEditor`; `formmodal` not `FormModal`). Body lines ≤ **140 chars** safety margin per Step 7.3.6 D-4 + Step 7.4 Q-4 lessons (em-dash near 100-150 char boundary triggers commitlint body→footer split). Prefer `-m` flags for multi-paragraph body over HEREDOC if HEREDOC fails.

---

## § 0. Hard triggers — verbatim quotes (STOP-and-surface if drift)

> **Mandatory**: Re-Read each file below at execution time and verify byte-for-byte match against the quote here. If HEAD has drifted — STOP, surface via `AskUserQuestion` with hypothesis, wait for planner. Planner-time HEAD is `8b200cf5` (2026-05-18 post-Step-7.4 close). Quotes are full-file verbatim unless noted "lines X-Y".

### § 0.1 `block-card.tsx` (Step 7.4 — extension target; no Intensity/TimeCap render currently per E2)

`apps/platform/src/modules/plan-detail/components/block-card.tsx` full verbatim (127 LOC):

```tsx
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

  const deleteDetails =
    block.labels.length > 0 ? block.labels.map((l) => l.name).join(", ") : "Empty block";

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
        details={deleteDetails}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteBlock.isPending}
      />
    </Box>
  );
};
```

### § 0.2 `use-blocks.ts` (Step 7.3 — partial-update hook target)

`apps/platform/src/lib/hooks/use-blocks.ts` full verbatim (59 LOC). `useUpdateBlock` mutate shape = `{blockId, data: UpdateBlockData}` where `UpdateBlockData = createBlockSchema = {intensity?, timeCap?, notes?, labelIds?}` all optional+nullable (per § 0.4 below). Partial update OK — Step 7.5 form submits `{blockId, data: {intensity, timeCap}}` (notes + labelIds not touched):

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

### § 0.3 `_shared/intensity.ts` + `_shared/time-cap.ts` (Step 7.0 D-2 pre-shipped affordances)

`packages/contracts/src/entities/lms/_shared/intensity.ts` full verbatim (58 LOC):

```typescript
import { z } from "zod";

export const HR_ZONES = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;
export const NUMERIC_PACE_DISTANCE_UNITS = ["km", "mi", "m", "yd", "lap"] as const;
export const NUMERIC_PACE_TYPES = ["min_per_distance", "distance_per_min"] as const;
export const PACE_VALUES = ["easy", "moderate", "hard", "recovery"] as const;

export const effortPercentSchema = z.union([
  z.object({ value: z.number().positive().max(100) }),
  z.object({
    range: z
      .object({
        min: z.number().positive().max(100),
        max: z.number().positive().max(100),
      })
      .refine((r) => r.min < r.max, { message: "range.min must be < range.max" }),
  }),
]);

export const rpeSchema = z.object({ value: z.number().positive().max(10) });

export const hrZoneSchema = z.object({
  zone: z.enum(HR_ZONES),
});

export const numericPaceSchema = z.object({
  value: z.string().min(1),
  distanceUnit: z.enum(NUMERIC_PACE_DISTANCE_UNITS),
  paceType: z.enum(NUMERIC_PACE_TYPES),
});

export const paceSchema = z.enum(PACE_VALUES);

export const intensitySchema = z
  .object({
    effortPercent: effortPercentSchema.optional(),
    rpe: rpeSchema.optional(),
    pace: paceSchema.optional(),
    hrZone: hrZoneSchema.optional(),
    numericPace: numericPaceSchema.optional(),
  })
  .refine(
    (v) =>
      v.effortPercent !== undefined ||
      v.rpe !== undefined ||
      v.pace !== undefined ||
      v.hrZone !== undefined ||
      v.numericPace !== undefined,
    { message: "intensity must set at least one dimension" },
  );

export type Intensity = z.infer<typeof intensitySchema>;
export type EffortPercent = z.infer<typeof effortPercentSchema>;
export type HrZoneIntensity = z.infer<typeof hrZoneSchema>;
export type NumericPaceIntensity = z.infer<typeof numericPaceSchema>;
export type PaceValue = z.infer<typeof paceSchema>;
export type RpeIntensity = z.infer<typeof rpeSchema>;
```

`packages/contracts/src/entities/lms/_shared/time-cap.ts` full verbatim (17 LOC). **TIME_CAP_UNITS = `["min", "sec"]` only — NO `"round"`** (corrected vs handoff hypothesis):

```typescript
import { z } from "zod";

export const TIME_CAP_UNITS = ["min", "sec"] as const;

export const timeCapSchema = z
  .object({
    min: z.number().positive(),
    max: z.number().positive().optional(),
    unit: z.enum(TIME_CAP_UNITS),
  })
  .refine((v) => v.max === undefined || v.min < v.max, {
    message: "timeCap.max must be > min when set",
  });

export type TimeCap = z.infer<typeof timeCapSchema>;
export type TimeCapUnit = (typeof TIME_CAP_UNITS)[number];
```

`packages/contracts/src/entities/lms/_shared/index.ts` full verbatim (3 LOC):

```typescript
export * from "./day-of-week";
export * from "./intensity";
export * from "./time-cap";
```

### § 0.4 `block.schema.ts` + `block-api.schema.ts` + `block.constants.ts` (contract shapes)

`packages/contracts/src/entities/lms/block/block.schema.ts` full verbatim (52 LOC). Note: `updateBlockSchema = createBlockSchema` — all fields optional+nullable; partial update OK. `block.intensity` and `block.timeCap` types = `intensitySchema | null` / `timeCapSchema | null`:

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

`packages/contracts/src/entities/lms/block/block.constants.ts` (5 LOC):

```typescript
export const BLOCK_CONSTANTS = {
  MAX_NOTES_LENGTH: 2000,
  MAX_LABELS_PER_BLOCK: 10,
} as const;
```

### § 0.5 `@repo/ui` `FormModal` + `BaseModal` (canonical form-modal shell)

`packages/ui/src/components/modal/form-modal.tsx` full verbatim (77 LOC) — Phase 2 BlockEditorModal will wrap children inside `<FormModal>`. Note `onSubmit` runs on `<form id={formId}>` element; `submitDisabled` controls Save button enabled state; `error` prop renders Alert above form fields:

```tsx
"use client";

import { type ReactNode, type FormEvent, useId } from "react";

import { Button, CircularProgress, Alert, Stack } from "@mui/material";

import { BaseModal, type BaseModalProps } from "./base-modal";

export type FormModalProps = Omit<BaseModalProps, "children" | "actions"> & {
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  isSubmitting?: boolean;
  submitText?: string;
  cancelText?: string;
  submitDisabled?: boolean;
  error?: string | null;
  hideActions?: boolean;
};

export const FormModal = ({
  children,
  onSubmit,
  isSubmitting = false,
  submitText = "Save",
  cancelText = "Cancel",
  submitDisabled = false,
  error,
  hideActions = false,
  onClose,
  disableBackdropClick,
  disableEscapeKeyDown,
  ...baseProps
}: FormModalProps) => {
  const formId = useId();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(event);
  };

  const shouldDisableClose = isSubmitting || disableBackdropClick;
  const shouldDisableEscape = isSubmitting || disableEscapeKeyDown;

  return (
    <BaseModal
      {...baseProps}
      onClose={onClose}
      disableBackdropClick={shouldDisableClose}
      disableEscapeKeyDown={shouldDisableEscape}
      actions={
        !hideActions && (
          <>
            <Button onClick={onClose} disabled={isSubmitting} size="small">
              {cancelText}
            </Button>

            <Button
              size="small"
              type="submit"
              form={formId}
              variant="contained"
              disabled={submitDisabled || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
            >
              {isSubmitting ? "Saving..." : submitText}
            </Button>
          </>
        )
      }
    >
      <Stack component="form" id={formId} onSubmit={handleSubmit} spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {children}
      </Stack>
    </BaseModal>
  );
};
```

`@repo/ui` re-exports `FormModal` from `packages/ui/src/components/modal/index.ts` (`export * from "./form-modal";`) and `packages/ui/src/components/index.ts` (`export * from "./modal";`). Import via `import { FormModal } from "@repo/ui";`. **Verified at HEAD `8b200cf5`**.

### § 0.6 `create-plan-dialog.tsx` (platform FormModal usage — canonical mirror)

`apps/platform/src/modules/plans/components/create-plan-dialog.tsx` full verbatim (81 LOC) — note: uses **plain useState** not RHF because form is 2-field trivial. BlockEditorModal is 6+ fields with conditional reveals + Zod refines, so RHF + zodResolver is the right call (per § 0.7 admin Exercise canonical pattern). FormModal wrap shape, `useRouter` post-submit redirect, `handleClose` reset-state-then-onClose all canonical:

```tsx
"use client";

import { type FormEvent, useState } from "react";

import { TextField } from "@mui/material";
import { useRouter } from "next/navigation";

import { FormModal } from "@repo/ui";

import { useCreateTrainingPlan } from "@app/lib/hooks";

type CreatePlanDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const CreatePlanDialog: React.FC<CreatePlanDialogProps> = ({ open, onClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const create = useCreateTrainingPlan();
  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    create.mutate(
      { name: trimmedName, description: description.trim() || undefined },
      {
        onSuccess: (plan) => {
          handleClose();
          router.push(`/coach/plans/${plan.id}`);
        },
      },
    );
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="New Training Plan"
      onSubmit={handleSubmit}
      isSubmitting={create.isPending}
      submitText="Create"
      submitDisabled={!name.trim()}
    >
      <TextField
        label="Plan name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        size="medium"
        fullWidth
        disabled={create.isPending}
      />

      <TextField
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        minRows={8}
        size="medium"
        fullWidth
        disabled={create.isPending}
      />
    </FormModal>
  );
};
```

### § 0.7 `basic-info-card.tsx` + `enum-select-field.tsx` (admin RHF + Controller canonical pattern)

`apps/admin/src/modules/exercises/components/basic-info-card.tsx` full verbatim (61 LOC) — shows `useFormContext<DataType>()` + `register("fieldName")` + `errors.fieldName?.message` pattern; **BlockEditorModal will mirror this `useFormContext`-driven pattern** for Field components OR pass `Control<T>` props — final shape per Phase 1 spec below:

```tsx
"use client";

import { Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { type CreateExerciseData } from "@repo/contracts/lms/exercise";
import { FormCard } from "@repo/ui";

import { EQUIPMENT_LABELS, MOVEMENT_TYPE_LABELS } from "../constants";

import { EnumSelectField } from "./enum-select-field";
import { SecondaryMovementSelect } from "./secondary-movement-select";

type BasicInfoCardProps = {
  isLoading: boolean;
};

export const BasicInfoCard = ({ isLoading }: BasicInfoCardProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateExerciseData>();

  return (
    <FormCard title="Basic info">
      <Stack spacing={3}>
        <TextField
          label="Canonical Name"
          placeholder="e.g. Back Squat"
          variant="outlined"
          fullWidth
          size="small"
          disabled={isLoading}
          error={!!errors.canonicalName}
          helperText={
            errors.canonicalName?.message ?? "Will be uniquely matched case-insensitively"
          }
          {...register("canonicalName")}
        />

        <EnumSelectField
          name="primaryEquipment"
          label="Primary Equipment"
          labels={EQUIPMENT_LABELS}
          error={errors.primaryEquipment}
          isLoading={isLoading}
        />

        <EnumSelectField
          name="movementTypeTagPrimary"
          label="Primary Movement Type"
          labels={MOVEMENT_TYPE_LABELS}
          error={errors.movementTypeTagPrimary}
          isLoading={isLoading}
        />

        <SecondaryMovementSelect error={errors.movementTypeTagSecondary} isLoading={isLoading} />
      </Stack>
    </FormCard>
  );
};
```

`apps/admin/src/modules/exercises/components/enum-select-field.tsx` full verbatim (47 LOC) — canonical `Controller`-wrapping `Select` pattern for enum dropdowns. Phase 1 Intensity Pace + HR Zone + NumericPace.distanceUnit + NumericPace.paceType + TimeCap.unit selectors will mirror this Controller idiom but with their own value/onChange shape:

```tsx
"use client";

import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import { Controller, useFormContext, type FieldError, type FieldPath } from "react-hook-form";

import { type CreateExerciseData } from "@repo/contracts/lms/exercise";

type EnumSelectFieldProps = {
  name: Extract<FieldPath<CreateExerciseData>, "primaryEquipment" | "movementTypeTagPrimary">;
  label: string;
  labels: Record<string, string>;
  error: FieldError | undefined;
  isLoading: boolean;
};

export const EnumSelectField = ({
  name,
  label,
  labels,
  error,
  isLoading,
}: EnumSelectFieldProps) => {
  const { control } = useFormContext<CreateExerciseData>();

  return (
    <FormControl fullWidth size="small" error={!!error}>
      <InputLabel>{label}</InputLabel>

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select {...field} label={label} disabled={isLoading}>
            {Object.entries(labels).map(([value, optionLabel]) => (
              <MenuItem key={value} value={value}>
                {optionLabel}
              </MenuItem>
            ))}
          </Select>
        )}
      />

      {error && <FormHelperText>{error.message}</FormHelperText>}
    </FormControl>
  );
};
```

### § 0.8 `session-card.tsx` (kebab + ConfirmationModal mirror pattern для BlockCard Edit MenuItem)

`apps/platform/src/modules/plan-detail/components/session-card.tsx` lines 87-131 (kebab IconButton + Menu + MenuItem + ConfirmationModal pattern) — verbatim mirror for Phase 4 BlockCard kebab extension. Phase 4 adds a **second** MenuItem "Edit details" above "Delete":

```tsx
        <IconButton
          ref={anchorRef}
          onClick={() => setMenuOpen(true)}
          aria-label="Session actions"
          size="small"
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box sx={{ pt: 1.5 }}>
        <BlockList
          planId={planId}
          startDate={startDate}
          sessionId={session.id}
          blocks={session.blocks}
        />
      </Box>

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

### § 0.9 Domain semantics — Block §1.3 + Intensity §2.3 + TimeCap §2.14 (coach-POV per `[[coach-pov-first]]`)

From `analysis/artifacts/05-synthesis/domain-model.md` (read-only forever per WORKFLOW.md). Verbatim quote:

**§1.3 Block** (lines 124-150):

```
**Purpose**: раздел сессии — группа schemas объединённых тренерским labelом и/или intent (strength-endurance / pump / core / warm-up).

**Attributes**:
- `id`.
- `order` — позиция внутри Session.
- `labels` — ordered array of LabelRef, 0..N (set semantics: dedup по identity, presentation-order).
- `intensity` — optional Intensity VO (block-level scope, inherits to schemas).
- `notes` — optional free-text.
- `time_cap` — optional TimeCap VO (для `PRACTICE [ 5-10 min ]`-style block-level time hint; см. edge-cases). **Эскалация Phase 4** — финализация Phase 6.
- `schemas` — ordered children, 0..N.

**Sample evidence**:
- 17 distinct labels (canonical, после case-insensitive dedup).
- 1 instance с block-level intensity (block-055).
```

**§2.3 Intensity** (lines 579-610):

```
**Phase 3.3 / Phase 4 correction**: НЕ discriminated union, а struct с optional fields. Partial overlay inheritance — каждое поле наследуется independently.

**Structure**:
- `effort_percent` — optional: `{ value: number }` или `{ range: { min, max } }`.
- `rpe` — optional: `{ value: number }`. Deferred (out-of-sample, model-ready).
- `pace` — optional: enum `easy` | `moderate` | `hard` | `recovery` (extensible).
- `hr_zone` — optional: `{ zone: "Z1" | "Z2" | "Z3" | "Z4" | "Z5" }` (Phase 7 Ext 1 / Q16). Endurance / aerobic prescriptions.
- `numeric_pace` — optional: `{ value: "MM:SS" string, distance_unit: "km" | "mi" | "m" | "yd" | "lap", pace_type: "min_per_distance" | "distance_per_min" }` (Phase 7 Ext 2 / Q17). Run / row / swim interval prescriptions.

**Scope**: block / schema / row.

**Sample evidence**:
- block-055: `EASY PACE` + `[ 70% EFFORT ]` → block.intensity = `{ effort_percent: { value: 70 }, pace: "easy" }`.
- block-078 / schema-1: `[ 75-80% Effort ]` → schema.intensity = `{ effort_percent: { range: { min: 75, max: 80 } } }`.
- Phase 7 hypothetical: Z2 endurance run → block.intensity = `{ hr_zone: { zone: "Z2" } }`. 500m row pace target → block.intensity = `{ numeric_pace: { value: "1:50", distance_unit: "m", pace_type: "min_per_distance" } }`.
```

**Coach-POV consequences**:

1. Intensity is **multi-set struct** — block-055 sample populates BOTH `pace` AND `effortPercent` simultaneously. UI MUST allow ≥1 dimension simultaneously (NOT discriminator radio between dimensions).
2. EffortPercent is **internally** discriminated union (`{value}` XOR `{range}`) — UI sub-toggle "Single value / Range" inside Effort section, mutually exclusive.
3. RPE deferred / out-of-sample but model-ready (Step 7.0 pre-shipped affordance). UI ships RPE section but coach may not populate (no sample data).
4. HR Zone + Numeric Pace are Phase 7 extensions (endurance/aerobic prescriptions). UI ships both per `[[coach-pov-first]]` — Step 7.0 D-2 already shipped affordances; consume them.

**§2.14 TimeCap** (lines 820-834):

```
Per Phase 4 §case-time-cap-on-label.

**Structure**:
- `min` — number.
- `max` — optional number (для range `5-10 min`).
- `unit` — `min` | `sec`.

**Scope**: block-level (для labels вида `PRACTICE [ 5-10 min ]`).

**Sample evidence**: 2 occurrences (block-146 only).

**Status**: ratified Phase 5 как block-attribute (см. Block §1.3 `time_cap`). Не Intensity, не Load — отдельный block-level temporal hint.
```

**Coach-POV consequences**:

1. TimeCap unit = **`min` | `sec` ONLY** — NO `round`, NO `hour` (verified at `time-cap.ts:3` Step 7.0 D-2).
2. `max` is opt-in (range 5-10 min vs single 5 min). UI Toggle "Add range" reveals max input.
3. TimeCap is block-level (NOT schema/row level — that's Intensity's scope).
4. Sample sparse (2 instances) — coach may rarely set; null is common.

### § 0.10 `components/index.ts` + `hooks/index.ts` barrels (registration target per `[[planner-verbatim-registration]]`)

`apps/platform/src/modules/plan-detail/components/index.ts` full verbatim (17 LOC). **Phase 1+2+3 add 4 new exports** (alphabetic insert; see § 3 Phase commits for exact positions):

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

`apps/platform/src/lib/hooks/index.ts` full verbatim (16 LOC) — **NOT touched in Step 7.5** (no new hooks; all logic lives in BlockEditorModal):

```typescript
export * from "./use-blocks";
export * from "./use-blur-commit";
export * from "./use-coach-athletes";
export * from "./use-current-user-role";
export * from "./use-coach-action-items";
export * from "./use-coach-dashboard";
export * from "./use-coach-invite";
export * from "./use-day-metadata";
export * from "./use-label-options";
export * from "./use-label-search";
export * from "./use-sessions";
export * from "./use-training-plans";
export * from "./use-users";
export * from "./use-week-mutation";
export * from "./use-weeks";
```

### § 0.A grep enumeration (mandatory pre-execution per `[[planner-consumer-pattern-read]]`)

Before Phase 1 starts, run these greps from repo root. **Expected hit counts** at planner-time HEAD `8b200cf5` listed; any deviation → STOP + surface.

```bash
# 0.A.1 — Verify no existing BlockEditor* / BlockIntensity* / BlockTimeCap* / RpeField / EffortPercentField / HrZoneField / NumericPaceField / PaceField / TimeCapFields names anywhere (clean namespace)
grep -rn "BlockEditorModal\|BlockIntensitySummary\|BlockTimeCapSummary\|EffortPercentField\|RpeField\|PaceField\|HrZoneField\|NumericPaceField\|TimeCapFields" apps/ packages/
# Expected: 0 hits

# 0.A.2 — Verify FormModal import path (canonical)
grep -rn "FormModal" packages/ui/src/components/modal/ apps/platform/src/
# Expected: FormModal definition + barrel re-exports + 2 callsites (create-plan-dialog.tsx, invite-athlete-dialog.tsx)

# 0.A.3 — Verify useUpdateBlock partial-update callsite (Phase 2 will call this)
grep -rn "useUpdateBlock" apps/platform/src/
# Expected: 1 hook definition (use-blocks.ts) + 1 callsite (block-card.tsx) + 1 re-export (hooks/index.ts)

# 0.A.4 — Verify intensitySchema + timeCapSchema imports (Phase 2 will consume)
grep -rn "intensitySchema\|timeCapSchema" packages/contracts/src/entities/lms/
# Expected: definitions in _shared/intensity.ts + _shared/time-cap.ts + 1 import in block/block.schema.ts each + 1 re-export each in _shared/index.ts

# 0.A.5 — Verify Chip MUI usage in plan-detail (Phase 4 read-display will use)
grep -rn "from \"@mui/material\"" apps/platform/src/modules/plan-detail/ | grep "Chip"
# Expected: 0 hits in plan-detail currently (no Chip-row read display shipped yet); Phase 4 adds first one

# 0.A.6 — Verify react-hook-form availability in platform (Phase 2 will import)
grep -rn "react-hook-form\|@hookform/resolvers" apps/platform/src/
# Expected: 1 set-password-form.tsx callsite (only existing RHF consumer in platform); Phase 2 adds 2nd

# 0.A.7 — Verify NO existing `Block.intensity` or `Block.timeCap` render anywhere in apps/platform (Step 7.4 deliberately omitted per E2)
grep -rn "block\.intensity\|block\.timeCap" apps/platform/src/
# Expected: 0 hits

# 0.A.8 — Verify domain-model + types alignment (sanity)
grep -n "TIME_CAP_UNITS\s*=" packages/contracts/src/entities/lms/_shared/time-cap.ts
# Expected: 1 hit, value = `["min", "sec"] as const` (NO "round" / "hour" / "h")
```

If any grep returns unexpected count → STOP + `AskUserQuestion` with hypothesis ("expected X, found Y in <file>; root cause likely Z; proceed/abort?").

### § 0.B Husky hook gates verbatim (per `[[husky-cross-package-squash]]` adversarial pass for commit strategy)

`.husky/pre-commit` (3 lines):

```
node scripts/check-secrets.mjs
npx lint-staged
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"
```

`.husky/pre-push` (2 lines):

```
pnpm dep:check
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"
```

`.husky/commit-msg` (1 line):

```
npx --no -- commitlint --edit $1
```

**Implications for Step 7.5 commits** (cross-package adversarial analysis):

- Phase 1 ships 6 new Field components in `apps/platform/` only → `pnpm turbo check-types --filter="...[HEAD]"` exercises platform only (single package). Each Field component is a pure controlled component with no upstream/downstream type dependencies on Phase 2+. ✅ Intermediate tree compiles clean.
- Phase 2 ships `block-editor-modal.tsx` that imports Phase 1 Field components → platform-only → ✅ compiles clean.
- Phase 3 ships 2 Summary components in `apps/platform/` only → platform-only → ✅.
- Phase 4 modifies `block-card.tsx` to integrate Edit menu + Chip-row + modal mount → platform-only → ✅.
- **No cross-package broken trees** at any intermediate commit. **Per-layer atomic OK; squash NOT required.** Final 4-commit chain (4 code + 1 docs).

### § 0.C Commitlint config verbatim

`commitlint.config.cjs` (15 LOC):

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

**Implications**:

- Subject ≤ 100 chars, fully lowercase (`blockeditor` not `BlockEditor`; `formmodal` not `FormModal`; `rhf` not `RHF`).
- Body lines ≤ **140 chars** safety margin (statutory 150, but em-dash near boundary triggers footer split per Step 7.3.6 D-4 + Step 7.4 Q-4 lessons). Use `-m` flags for multi-paragraph body if HEREDOC fails.
- Type from enum (use `feat` for new components + integration; `docs` for output.md commit).
- Scope = lower-case (e.g., `feat(platform):`).

---

## § 1. Goal

Ship **complete Block-level Intensity + TimeCap UI surface** — both EDIT (FormModal with RHF + zodResolver) AND READ display (Chip-row inside BlockCard) — closing the E2 commitment from Step 7.4 (Step 7.4 omitted both render and edit; Step 7.5 owns both atomically). Coach can: open BlockCard kebab → "Edit details" → BlockEditorModal opens → toggle Intensity dimensions (5 independent Switches) + optionally set TimeCap (min/max?/unit) → Save → optimistic week-cache invalidate → modal closes → BlockCard Chip-row updates with new values. Clear-all path: toggle all Intensity Switches OFF + TimeCap Switch OFF → Save → `intensity: null`, `timeCap: null` shipped to API.

**LAST code commit before coach validation pause** per `[[training-domain-validation-gate]]`. User pre-committed Option 1 (full Step 8 Schema editor) at thesis 2026-05-18 — Step 7.5 → Step 8.0 trajectory locked.

## § 2. Inputs (verbatim confirmed at prompt-write time per § 0)

1. Step 7.0 D-2 pre-shipped affordances (`intensitySchema` / `timeCapSchema` / 5 standalone sub-schemas / 4 `as const` tuples) — § 0.3.
2. Current `block-card.tsx` shape (Step 7.4) — § 0.1; extension target.
3. `useUpdateBlock` partial-update signature (Step 7.3) — § 0.2.
4. `@repo/ui FormModal` shell (canonical pattern) — § 0.5.
5. Canonical RHF + Controller pattern (admin Exercise) — § 0.7.
6. Canonical FormModal usage (platform CreatePlanDialog) — § 0.6.
7. Canonical kebab + Menu + Modal pattern (SessionCard) — § 0.8.
8. Domain semantics (Block §1.3 + Intensity §2.3 + TimeCap §2.14) — § 0.9.
9. Components barrel current shape — § 0.10.
10. Husky + commitlint gates — § 0.B + § 0.C.

## § 3. Phases (4 sequential atomic per-layer commits + 1 docs)

**Pipeline**: `/feature` full. Each Phase = 1 atomic commit; output.md commit follows.

### Phase 1 — 6 controlled Field components (5 Intensity + 1 TimeCap) + barrel +6

**Scope**: `apps/platform/src/modules/plan-detail/components/` × 6 new files + `components/index.ts` += 6 entries (alphabetic insert).

**Files to create** (each is a stateless controlled component — `{value, onChange, disabled?, error?}` shape; NO RHF internal use, NO `useState`):

#### Phase 1.1 — `effort-percent-field.tsx`

Internally discriminated (`{value}` XOR `{range}`); UI sub-toggle:

```tsx
"use client";

import {
  Box,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import type { EffortPercent } from "@repo/contracts/lms/_shared";

type EffortPercentFieldProps = {
  value: EffortPercent | undefined;
  onChange: (next: EffortPercent | undefined) => void;
  disabled?: boolean;
};

export const EffortPercentField = ({
  value,
  onChange,
  disabled = false,
}: EffortPercentFieldProps) => {
  const enabled = value !== undefined;
  const mode: "value" | "range" = value !== undefined && "range" in value ? "range" : "value";

  const handleToggle = (_: unknown, next: boolean) => {
    if (next) {
      onChange({ value: 70 });
    } else {
      onChange(undefined);
    }
  };

  const handleModeChange = (_: unknown, next: "value" | "range" | null) => {
    if (next === null) return;
    if (next === "value") {
      onChange({ value: 70 });
    } else {
      onChange({ range: { min: 70, max: 80 } });
    }
  };

  const handleValueChange = (n: number) => onChange({ value: n });
  const handleRangeMinChange = (n: number) => {
    if (value !== undefined && "range" in value) {
      onChange({ range: { min: n, max: value.range.max } });
    }
  };
  const handleRangeMaxChange = (n: number) => {
    if (value !== undefined && "range" in value) {
      onChange({ range: { min: value.range.min, max: n } });
    }
  };

  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={handleToggle} disabled={disabled} />}
        label="Effort %"
      />

      {enabled && (
        <Stack spacing={1.5} sx={{ pl: 4, pt: 1 }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            size="small"
            disabled={disabled}
          >
            <ToggleButton value="value">Single</ToggleButton>
            <ToggleButton value="range">Range</ToggleButton>
          </ToggleButtonGroup>

          {mode === "value" && value !== undefined && "value" in value && (
            <TextField
              label="Value %"
              type="number"
              size="small"
              value={value.value}
              onChange={(e) => handleValueChange(Number(e.target.value))}
              inputProps={{ min: 1, max: 100 }}
              disabled={disabled}
              sx={{ maxWidth: 160 }}
            />
          )}

          {mode === "range" && value !== undefined && "range" in value && (
            <Stack direction="row" spacing={1}>
              <TextField
                label="Min %"
                type="number"
                size="small"
                value={value.range.min}
                onChange={(e) => handleRangeMinChange(Number(e.target.value))}
                inputProps={{ min: 1, max: 100 }}
                disabled={disabled}
                sx={{ maxWidth: 120 }}
              />
              <TextField
                label="Max %"
                type="number"
                size="small"
                value={value.range.max}
                onChange={(e) => handleRangeMaxChange(Number(e.target.value))}
                inputProps={{ min: 1, max: 100 }}
                disabled={disabled}
                sx={{ maxWidth: 120 }}
              />
            </Stack>
          )}
        </Stack>
      )}
    </Box>
  );
};
```

#### Phase 1.2 — `rpe-field.tsx`

```tsx
"use client";

import { Box, FormControlLabel, Stack, Switch, TextField } from "@mui/material";

import type { RpeIntensity } from "@repo/contracts/lms/_shared";

type RpeFieldProps = {
  value: RpeIntensity | undefined;
  onChange: (next: RpeIntensity | undefined) => void;
  disabled?: boolean;
};

export const RpeField = ({ value, onChange, disabled = false }: RpeFieldProps) => {
  const enabled = value !== undefined;

  const handleToggle = (_: unknown, next: boolean) => {
    if (next) {
      onChange({ value: 7 });
    } else {
      onChange(undefined);
    }
  };

  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={handleToggle} disabled={disabled} />}
        label="RPE"
      />

      {enabled && value !== undefined && (
        <Stack sx={{ pl: 4, pt: 1 }}>
          <TextField
            label="RPE (1-10)"
            type="number"
            size="small"
            value={value.value}
            onChange={(e) => onChange({ value: Number(e.target.value) })}
            inputProps={{ min: 1, max: 10, step: 0.5 }}
            disabled={disabled}
            sx={{ maxWidth: 160 }}
          />
        </Stack>
      )}
    </Box>
  );
};
```

#### Phase 1.3 — `pace-field.tsx`

```tsx
"use client";

import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
} from "@mui/material";

import { PACE_VALUES, type PaceValue } from "@repo/contracts/lms/_shared";

const PACE_LABELS: Record<PaceValue, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
  recovery: "Recovery",
};

type PaceFieldProps = {
  value: PaceValue | undefined;
  onChange: (next: PaceValue | undefined) => void;
  disabled?: boolean;
};

export const PaceField = ({ value, onChange, disabled = false }: PaceFieldProps) => {
  const enabled = value !== undefined;

  const handleToggle = (_: unknown, next: boolean) => {
    if (next) {
      onChange("easy");
    } else {
      onChange(undefined);
    }
  };

  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={handleToggle} disabled={disabled} />}
        label="Pace"
      />

      {enabled && value !== undefined && (
        <Stack sx={{ pl: 4, pt: 1 }}>
          <FormControl size="small" sx={{ maxWidth: 200 }} disabled={disabled}>
            <InputLabel>Pace</InputLabel>
            <Select
              value={value}
              label="Pace"
              onChange={(e) => onChange(e.target.value as PaceValue)}
            >
              {PACE_VALUES.map((p) => (
                <MenuItem key={p} value={p}>
                  {PACE_LABELS[p]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      )}
    </Box>
  );
};
```

#### Phase 1.4 — `hr-zone-field.tsx`

```tsx
"use client";

import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
} from "@mui/material";

import { HR_ZONES, type HrZoneIntensity } from "@repo/contracts/lms/_shared";

type HrZoneFieldProps = {
  value: HrZoneIntensity | undefined;
  onChange: (next: HrZoneIntensity | undefined) => void;
  disabled?: boolean;
};

export const HrZoneField = ({ value, onChange, disabled = false }: HrZoneFieldProps) => {
  const enabled = value !== undefined;

  const handleToggle = (_: unknown, next: boolean) => {
    if (next) {
      onChange({ zone: "Z2" });
    } else {
      onChange(undefined);
    }
  };

  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={handleToggle} disabled={disabled} />}
        label="HR Zone"
      />

      {enabled && value !== undefined && (
        <Stack sx={{ pl: 4, pt: 1 }}>
          <FormControl size="small" sx={{ maxWidth: 160 }} disabled={disabled}>
            <InputLabel>Zone</InputLabel>
            <Select
              value={value.zone}
              label="Zone"
              onChange={(e) => onChange({ zone: e.target.value as (typeof HR_ZONES)[number] })}
            >
              {HR_ZONES.map((z) => (
                <MenuItem key={z} value={z}>
                  {z}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      )}
    </Box>
  );
};
```

#### Phase 1.5 — `numeric-pace-field.tsx`

```tsx
"use client";

import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";

import {
  NUMERIC_PACE_DISTANCE_UNITS,
  NUMERIC_PACE_TYPES,
  type NumericPaceIntensity,
} from "@repo/contracts/lms/_shared";

const PACE_TYPE_LABELS: Record<(typeof NUMERIC_PACE_TYPES)[number], string> = {
  min_per_distance: "min/distance",
  distance_per_min: "distance/min",
};

type NumericPaceFieldProps = {
  value: NumericPaceIntensity | undefined;
  onChange: (next: NumericPaceIntensity | undefined) => void;
  disabled?: boolean;
};

export const NumericPaceField = ({ value, onChange, disabled = false }: NumericPaceFieldProps) => {
  const enabled = value !== undefined;

  const handleToggle = (_: unknown, next: boolean) => {
    if (next) {
      onChange({ value: "1:50", distanceUnit: "km", paceType: "min_per_distance" });
    } else {
      onChange(undefined);
    }
  };

  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={handleToggle} disabled={disabled} />}
        label="Numeric pace"
      />

      {enabled && value !== undefined && (
        <Stack direction="row" spacing={1} sx={{ pl: 4, pt: 1, flexWrap: "wrap" }}>
          <TextField
            label="Value (e.g. 1:50)"
            size="small"
            value={value.value}
            onChange={(e) => onChange({ ...value, value: e.target.value })}
            disabled={disabled}
            sx={{ maxWidth: 160 }}
          />
          <FormControl size="small" sx={{ maxWidth: 120 }} disabled={disabled}>
            <InputLabel>Distance</InputLabel>
            <Select
              value={value.distanceUnit}
              label="Distance"
              onChange={(e) =>
                onChange({
                  ...value,
                  distanceUnit: e.target.value as (typeof NUMERIC_PACE_DISTANCE_UNITS)[number],
                })
              }
            >
              {NUMERIC_PACE_DISTANCE_UNITS.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }} disabled={disabled}>
            <InputLabel>Direction</InputLabel>
            <Select
              value={value.paceType}
              label="Direction"
              onChange={(e) =>
                onChange({
                  ...value,
                  paceType: e.target.value as (typeof NUMERIC_PACE_TYPES)[number],
                })
              }
            >
              {NUMERIC_PACE_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {PACE_TYPE_LABELS[t]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      )}
    </Box>
  );
};
```

#### Phase 1.6 — `time-cap-fields.tsx`

Section-level Switch (whole-TimeCap toggle) + min input + maxToggle + max input + unit ToggleButtonGroup:

```tsx
"use client";

import {
  Box,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import { TIME_CAP_UNITS, type TimeCap, type TimeCapUnit } from "@repo/contracts/lms/_shared";

type TimeCapFieldsProps = {
  value: TimeCap | null;
  onChange: (next: TimeCap | null) => void;
  disabled?: boolean;
};

export const TimeCapFields = ({ value, onChange, disabled = false }: TimeCapFieldsProps) => {
  const enabled = value !== null;
  const rangeEnabled = value !== null && value.max !== undefined;

  const handleSectionToggle = (_: unknown, next: boolean) => {
    if (next) {
      onChange({ min: 5, unit: "min" });
    } else {
      onChange(null);
    }
  };

  const handleRangeToggle = (_: unknown, next: boolean) => {
    if (value === null) return;
    if (next) {
      onChange({ ...value, max: value.min + 5 });
    } else {
      onChange({ min: value.min, unit: value.unit });
    }
  };

  const handleMinChange = (n: number) => {
    if (value === null) return;
    onChange({ ...value, min: n });
  };
  const handleMaxChange = (n: number) => {
    if (value === null) return;
    onChange({ ...value, max: n });
  };
  const handleUnitChange = (_: unknown, next: TimeCapUnit | null) => {
    if (next === null || value === null) return;
    onChange({ ...value, unit: next });
  };

  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={handleSectionToggle} disabled={disabled} />}
        label="Time cap"
      />

      {enabled && value !== null && (
        <Stack spacing={1.5} sx={{ pl: 4, pt: 1 }}>
          <Stack direction="row" spacing={1}>
            <TextField
              label="Min"
              type="number"
              size="small"
              value={value.min}
              onChange={(e) => handleMinChange(Number(e.target.value))}
              inputProps={{ min: 1, step: 1 }}
              disabled={disabled}
              sx={{ maxWidth: 120 }}
            />
            {rangeEnabled && (
              <TextField
                label="Max"
                type="number"
                size="small"
                value={value.max ?? 0}
                onChange={(e) => handleMaxChange(Number(e.target.value))}
                inputProps={{ min: 1, step: 1 }}
                disabled={disabled}
                sx={{ maxWidth: 120 }}
              />
            )}
          </Stack>

          <FormControlLabel
            control={
              <Switch checked={rangeEnabled} onChange={handleRangeToggle} disabled={disabled} />
            }
            label="Add range max"
          />

          <ToggleButtonGroup
            value={value.unit}
            exclusive
            onChange={handleUnitChange}
            size="small"
            disabled={disabled}
          >
            {TIME_CAP_UNITS.map((u) => (
              <ToggleButton key={u} value={u}>
                {u}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      )}
    </Box>
  );
};
```

**Barrel update** — `apps/platform/src/modules/plan-detail/components/index.ts` adds 6 alphabetic-insert entries. Final state after Phase 1:

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
export { EffortPercentField } from "./effort-percent-field";
export { HrZoneField } from "./hr-zone-field";
export { NumericPaceField } from "./numeric-pace-field";
export { PaceField } from "./pace-field";
export { RpeField } from "./rpe-field";
export { SessionCard } from "./session-card";
export { SessionLabelSelect } from "./session-label-select";
export { SessionList } from "./session-list";
export { SessionNotesField } from "./session-notes-field";
export { TimeCapFields } from "./time-cap-fields";
export { WeekGrid } from "./week-grid";
export { WeekNavigator } from "./week-navigator";
export { WeekNotes } from "./week-notes";
```

**Phase 1 commit message** (subject ≤ 100 chars, fully lowercase):

```
feat(platform): add intensity and timecap field components for block editor
```

Body (4-5 lines ≤ 140 chars each):

```
new files: effort-percent-field, rpe-field, pace-field, hr-zone-field, numeric-pace-field, time-cap-fields.
each is a pure controlled component with {value, onChange, disabled?} props.
toggleable via switch; effort-percent has internal value/range mutex via togglebuttongroup.
time-cap unit togglebuttongroup uses time_cap_units tuple from contracts (min/sec only, no round).
barrel index.ts gains 6 alphabetic entries.
```

**Phase 1 verification** (executor runs all):

- `pnpm --filter platform check-types` — must pass (each Field is stateless, MUI types satisfied, no RHF dep yet).
- `pnpm --filter platform lint` — must pass with 0 warnings. **Critical**: `react/no-multi-comp` should NOT fire since each file = 1 component (per `[[one-component-per-file]]` + `[[planner-lint-impact-trace]]` 9th flavour). DO NOT extract sub-render helpers to module scope; keep all conditional JSX inline within the component closure.
- `pnpm test` — baseline preserved (no test deltas; Field components NOT unit-tested per `[[no-tech-debt-in-mocks]]`; smoke-test covers UI behavior).
- Husky pre-commit (check-secrets + lint-staged + turbo check-types) — clean.

### Phase 2 — `block-editor-modal.tsx` (FormModal shell + useForm + Controllers + transforms) + barrel +1

**Scope**: 1 new file `apps/platform/src/modules/plan-detail/components/block-editor-modal.tsx` + barrel += 1 entry (alphabetic insert after `BlockCard`).

**Design contract**:

- Uses `@repo/ui FormModal` as shell.
- Uses `react-hook-form` + `@hookform/resolvers/zod` per canonical admin Exercise pattern (§ 0.7).
- Form data shape = UI-flavored (5 Intensity dimensions as optional fields per `intensitySchema` + TimeCap as nullable). Transform on submit: build `Intensity | null` from form state (return `null` if zero dims set; return validated object otherwise) + build `TimeCap | null` likewise.
- Resolver: build a Zod schema that mirrors `intensitySchema` (without the `≥1` refine since UI permits zero-dim draft state) wrapped in `.nullable()` style for both intensity + timeCap.
- onSubmit: `useUpdateBlock.mutate({blockId, data: {intensity: builtIntensity, timeCap: builtTimeCap}})` — single mutation call, single optimistic week-invalidate.
- Modal close on success.
- Initial form state derived from `block.intensity` (could be null → all dims off) + `block.timeCap` (could be null → section off).
- Modal **re-syncs form state when `block` prop changes** (e.g., after Save → block refetched with new values) via `useEffect([block.intensity, block.timeCap])` + `reset()`.

**File**:

```tsx
"use client";

import { type FormEvent, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type { Block } from "@repo/contracts/lms/block";
import {
  effortPercentSchema,
  hrZoneSchema,
  type Intensity,
  numericPaceSchema,
  paceSchema,
  rpeSchema,
  type TimeCap,
  timeCapSchema,
} from "@repo/contracts/lms/_shared";
import { FormModal } from "@repo/ui";

import { useUpdateBlock } from "@app/lib/hooks";

import { EffortPercentField } from "./effort-percent-field";
import { HrZoneField } from "./hr-zone-field";
import { NumericPaceField } from "./numeric-pace-field";
import { PaceField } from "./pace-field";
import { RpeField } from "./rpe-field";
import { TimeCapFields } from "./time-cap-fields";

const blockEditorFormSchema = z.object({
  intensity: z.object({
    effortPercent: effortPercentSchema.optional(),
    rpe: rpeSchema.optional(),
    pace: paceSchema.optional(),
    hrZone: hrZoneSchema.optional(),
    numericPace: numericPaceSchema.optional(),
  }),
  timeCap: timeCapSchema.nullable(),
});

type BlockEditorFormData = z.infer<typeof blockEditorFormSchema>;

const toFormData = (block: Block): BlockEditorFormData => ({
  intensity: {
    ...(block.intensity?.effortPercent !== undefined && {
      effortPercent: block.intensity.effortPercent,
    }),
    ...(block.intensity?.rpe !== undefined && { rpe: block.intensity.rpe }),
    ...(block.intensity?.pace !== undefined && { pace: block.intensity.pace }),
    ...(block.intensity?.hrZone !== undefined && { hrZone: block.intensity.hrZone }),
    ...(block.intensity?.numericPace !== undefined && {
      numericPace: block.intensity.numericPace,
    }),
  },
  timeCap: block.timeCap,
});

const buildIntensityPayload = (form: BlockEditorFormData["intensity"]): Intensity | null => {
  const hasAny =
    form.effortPercent !== undefined ||
    form.rpe !== undefined ||
    form.pace !== undefined ||
    form.hrZone !== undefined ||
    form.numericPace !== undefined;

  if (!hasAny) return null;

  return {
    ...(form.effortPercent !== undefined && { effortPercent: form.effortPercent }),
    ...(form.rpe !== undefined && { rpe: form.rpe }),
    ...(form.pace !== undefined && { pace: form.pace }),
    ...(form.hrZone !== undefined && { hrZone: form.hrZone }),
    ...(form.numericPace !== undefined && { numericPace: form.numericPace }),
  };
};

const buildTimeCapPayload = (form: BlockEditorFormData["timeCap"]): TimeCap | null => form;

type BlockEditorModalProps = {
  open: boolean;
  onClose: () => void;
  block: Block;
  planId: string;
  startDate: string;
};

export const BlockEditorModal: React.FC<BlockEditorModalProps> = ({
  open,
  onClose,
  block,
  planId,
  startDate,
}) => {
  const updateBlock = useUpdateBlock(planId, startDate);

  const { control, handleSubmit, reset } = useForm<BlockEditorFormData>({
    resolver: zodResolver(blockEditorFormSchema),
    defaultValues: toFormData(block),
  });

  useEffect(() => {
    reset(toFormData(block));
  }, [block, reset]);

  const onSubmit = (data: BlockEditorFormData) => {
    const intensity = buildIntensityPayload(data.intensity);
    const timeCap = buildTimeCapPayload(data.timeCap);

    updateBlock.mutate(
      { blockId: block.id, data: { intensity, timeCap } },
      { onSuccess: () => onClose() },
    );
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(e);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Edit block details"
      onSubmit={handleFormSubmit}
      isSubmitting={updateBlock.isPending}
      submitText="Save"
    >
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Intensity (set any combination)
        </Typography>

        <Controller
          name="intensity.effortPercent"
          control={control}
          render={({ field }) => (
            <EffortPercentField
              value={field.value}
              onChange={field.onChange}
              disabled={updateBlock.isPending}
            />
          )}
        />

        <Controller
          name="intensity.rpe"
          control={control}
          render={({ field }) => (
            <RpeField
              value={field.value}
              onChange={field.onChange}
              disabled={updateBlock.isPending}
            />
          )}
        />

        <Controller
          name="intensity.pace"
          control={control}
          render={({ field }) => (
            <PaceField
              value={field.value}
              onChange={field.onChange}
              disabled={updateBlock.isPending}
            />
          )}
        />

        <Controller
          name="intensity.hrZone"
          control={control}
          render={({ field }) => (
            <HrZoneField
              value={field.value}
              onChange={field.onChange}
              disabled={updateBlock.isPending}
            />
          )}
        />

        <Controller
          name="intensity.numericPace"
          control={control}
          render={({ field }) => (
            <NumericPaceField
              value={field.value}
              onChange={field.onChange}
              disabled={updateBlock.isPending}
            />
          )}
        />

        <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
          Time cap
        </Typography>

        <Controller
          name="timeCap"
          control={control}
          render={({ field }) => (
            <TimeCapFields
              value={field.value}
              onChange={field.onChange}
              disabled={updateBlock.isPending}
            />
          )}
        />
      </Stack>
    </FormModal>
  );
};
```

**Barrel update** — alphabetic insert after `BlockCard`:

```typescript
export { BlockCard } from "./block-card";
export { BlockEditorModal } from "./block-editor-modal";
export { BlockLabelSelect } from "./block-label-select";
```

**Phase 2 commit message**:

```
feat(platform): add blockeditormodal with rhf + zod resolver for intensity and timecap
```

Body:

```
new file block-editor-modal.tsx wraps formmodal shell.
useform + zodresolver(blockeditorformschema) builds form from block.intensity / block.timecap.
controllers wrap 6 field components from phase 1.
build helpers transform ui form state to intensity | null + timecap | null partial-update payload.
single useupdateblock.mutate call on submit; modal closes on success.
useeffect-reset syncs form state when block prop changes (post-save refetch).
barrel +1 alphabetic after blockcard.
```

**Phase 2 verification**:

- `pnpm --filter platform check-types` — must pass. `BlockEditorFormData` Zod-inferred; Controller `field.onChange` matches each Field's `onChange` signature.
- `pnpm --filter platform lint` — must pass with 0 warnings.
- `pnpm test` — baseline preserved.
- Husky pre-commit clean.

### Phase 3 — 2 Summary read-display components + barrel +2

**Scope**: 2 new files (`block-intensity-summary.tsx` + `block-time-cap-summary.tsx`) + barrel += 2 alphabetic-insert entries.

#### Phase 3.1 — `block-intensity-summary.tsx`

Renders `Chip[]` row from `block.intensity` (each populated dimension = 1 Chip). Returns `null` if `intensity === null` (no Chip row rendered):

```tsx
"use client";

import { Chip, Stack } from "@mui/material";

import type { Intensity } from "@repo/contracts/lms/_shared";

type BlockIntensitySummaryProps = {
  intensity: Intensity | null;
};

const formatEffortPercent = (ep: NonNullable<Intensity["effortPercent"]>): string => {
  if ("value" in ep) return `${ep.value}% effort`;
  return `${ep.range.min}-${ep.range.max}% effort`;
};

const formatRpe = (r: NonNullable<Intensity["rpe"]>): string => `RPE ${r.value}`;

const formatHrZone = (h: NonNullable<Intensity["hrZone"]>): string => h.zone;

const formatNumericPace = (n: NonNullable<Intensity["numericPace"]>): string => {
  const direction = n.paceType === "min_per_distance" ? "/" : " per ";
  return `${n.value}${direction}${n.distanceUnit}`;
};

export const BlockIntensitySummary = ({ intensity }: BlockIntensitySummaryProps) => {
  if (intensity === null) return null;

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {intensity.effortPercent !== undefined && (
        <Chip size="small" label={formatEffortPercent(intensity.effortPercent)} />
      )}
      {intensity.rpe !== undefined && <Chip size="small" label={formatRpe(intensity.rpe)} />}
      {intensity.pace !== undefined && <Chip size="small" label={intensity.pace} />}
      {intensity.hrZone !== undefined && (
        <Chip size="small" label={formatHrZone(intensity.hrZone)} />
      )}
      {intensity.numericPace !== undefined && (
        <Chip size="small" label={formatNumericPace(intensity.numericPace)} />
      )}
    </Stack>
  );
};
```

#### Phase 3.2 — `block-time-cap-summary.tsx`

Returns `null` if `timeCap === null`; otherwise renders 1 Chip with formatted cap:

```tsx
"use client";

import { Chip } from "@mui/material";

import type { TimeCap } from "@repo/contracts/lms/_shared";

type BlockTimeCapSummaryProps = {
  timeCap: TimeCap | null;
};

const formatTimeCap = (tc: TimeCap): string => {
  if (tc.max !== undefined) {
    return `${tc.min}-${tc.max} ${tc.unit} cap`;
  }
  return `${tc.min} ${tc.unit} cap`;
};

export const BlockTimeCapSummary = ({ timeCap }: BlockTimeCapSummaryProps) => {
  if (timeCap === null) return null;

  return <Chip size="small" label={formatTimeCap(timeCap)} />;
};
```

**Barrel update** — alphabetic-insert 2 entries (after `BlockEditorModal` and `BlockNotesField`):

```typescript
export { BlockEditorModal } from "./block-editor-modal";
export { BlockIntensitySummary } from "./block-intensity-summary";
export { BlockLabelSelect } from "./block-label-select";
export { BlockList } from "./block-list";
export { BlockNotesField } from "./block-notes-field";
export { BlockTimeCapSummary } from "./block-time-cap-summary";
```

**Phase 3 commit message**:

```
feat(platform): add chip-row read display for block intensity and timecap
```

Body:

```
new files block-intensity-summary + block-time-cap-summary render chip rows from block.intensity / block.timecap.
intensity summary emits one chip per populated dimension (effortpercent / rpe / pace / hrzone / numericpace).
timecap summary emits single chip with min[-max] unit cap format.
both return null when source is null; no chip row rendered for empty blocks.
barrel +2 alphabetic.
```

**Phase 3 verification**:

- `pnpm --filter platform check-types` — must pass.
- `pnpm --filter platform lint` — 0 warnings. `[[planner-lint-impact-trace]]` 9th flavour: `formatEffortPercent` / `formatRpe` / `formatHrZone` / `formatNumericPace` / `formatTimeCap` are pure non-JSX helpers (return string), so they CAN live at module scope without triggering `react/no-multi-comp`. Verify: each returns `string`, NOT JSX.
- `pnpm test` — baseline preserved.
- Husky clean.

### Phase 4 — `block-card.tsx` integration (kebab Edit MenuItem + Chip-row mount + modal mount)

**Scope**: 1 file modified — `apps/platform/src/modules/plan-detail/components/block-card.tsx`. No new files; no barrel touch.

**Changes**:

1. Import 3 new components: `BlockEditorModal`, `BlockIntensitySummary`, `BlockTimeCapSummary`.
2. Add `editOpen` state: `const [editOpen, setEditOpen] = useState(false);` adjacent to existing `menuOpen` + `deleteOpen`.
3. Add MenuItem "Edit details" above "Delete" inside `<Menu>`:
   ```tsx
   <MenuItem
     onClick={() => {
       setMenuOpen(false);
       setEditOpen(true);
     }}
   >
     <ListItemIcon>
       <EditIcon fontSize="small" />
     </ListItemIcon>
     <ListItemText>Edit details</ListItemText>
   </MenuItem>
   ```
4. Add `<EditIcon>` import from `@mui/icons-material/Edit`.
5. Render Chip-row **between main row and** (any future inner content) — wrapped в `<Box sx={{pt: 1, display: "flex", gap: 0.5, flexWrap: "wrap"}}>`:
   ```tsx
   <Box sx={{ pt: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
     <BlockIntensitySummary intensity={block.intensity} />
     <BlockTimeCapSummary timeCap={block.timeCap} />
   </Box>
   ```
   **Important**: if BOTH `intensity === null` AND `timeCap === null`, the Box still renders but contains nothing visible (zero children, zero padding visible). Acceptable — keeps layout stable across populated/empty states. Alternative: conditionally skip Box render when both null. Pick conditional skip — cleaner: `{(block.intensity !== null || block.timeCap !== null) && <Box>...</Box>}`.
6. Mount `<BlockEditorModal>` adjacent to existing `<ConfirmationModal>`:
   ```tsx
   <BlockEditorModal
     open={editOpen}
     onClose={() => setEditOpen(false)}
     block={block}
     planId={planId}
     startDate={startDate}
   />
   ```

**Final `block-card.tsx` shape (verbatim target)**:

```tsx
"use client";

import { useRef, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack } from "@mui/material";

import type { Block } from "@repo/contracts/lms/block";
import { ConfirmationModal } from "@repo/ui";

import { useAssignBlockLabels, useDeleteBlock, useUpdateBlock } from "@app/lib/hooks";

import { BlockEditorModal } from "./block-editor-modal";
import { BlockIntensitySummary } from "./block-intensity-summary";
import { BlockLabelSelect } from "./block-label-select";
import { BlockNotesField } from "./block-notes-field";
import { BlockTimeCapSummary } from "./block-time-cap-summary";

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
  const [editOpen, setEditOpen] = useState(false);
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

  const deleteDetails =
    block.labels.length > 0 ? block.labels.map((l) => l.name).join(", ") : "Empty block";

  const hasSummary = block.intensity !== null || block.timeCap !== null;

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

      {hasSummary && (
        <Box sx={{ pt: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          <BlockIntensitySummary intensity={block.intensity} />
          <BlockTimeCapSummary timeCap={block.timeCap} />
        </Box>
      )}

      <Menu anchorEl={anchorRef.current} open={menuOpen} onClose={() => setMenuOpen(false)}>
        <MenuItem
          onClick={() => {
            setMenuOpen(false);
            setEditOpen(true);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit details</ListItemText>
        </MenuItem>

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

      <BlockEditorModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        block={block}
        planId={planId}
        startDate={startDate}
      />

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete block"
        type="danger"
        message="Delete this block?"
        details={deleteDetails}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteBlock.isPending}
      />
    </Box>
  );
};
```

**Phase 4 commit message**:

```
feat(platform): integrate intensity timecap edit modal and chip summary into blockcard
```

Body:

```
block-card.tsx gains edit-details kebab menuitem above delete (editicon icon adornment).
new state editopen drives blockeditormodal mount.
chip row renders between main stack and menu only when block.intensity or block.timecap is non-null.
blockintensitysummary + blocktimecapsummary side-by-side in flexwrap box with 0.5 gap.
modal mount sits adjacent to confirmationmodal at component bottom; block prop passed through for form sync.
```

**Phase 4 verification**:

- `pnpm --filter platform check-types` — must pass. Imports resolved (BlockEditorModal, BlockIntensitySummary, BlockTimeCapSummary, EditIcon). `block.intensity` / `block.timeCap` types from `@repo/contracts/lms/block` flow through correctly.
- `pnpm --filter platform lint` — 0 warnings. **Critical**: no JSX-returning helpers extracted to module scope in block-card.tsx; `hasSummary` is a boolean computed inline (acceptable; not JSX).
- `pnpm test` — baseline preserved.
- Husky clean.

### Phase 5 — `docs(step-07.5): write executor output report`

Standard output.md commit after all code phases ship. Run all final verifications + spot-checks before authoring output.md per WORKFLOW.md § "output.md format". Single commit; no scope conflicts.

---

## § 4. Acceptance criteria (self-check in `output.md`)

### Phase 1 — Field components

1. 6 new files created at `apps/platform/src/modules/plan-detail/components/`: `effort-percent-field.tsx`, `rpe-field.tsx`, `pace-field.tsx`, `hr-zone-field.tsx`, `numeric-pace-field.tsx`, `time-cap-fields.tsx`.
2. Each Field component is a pure controlled component: takes `{value, onChange, disabled?}` props; no internal `useState`; no internal RHF; no `useFormContext` use.
3. `EffortPercentField` has internal `value`/`range` ToggleButtonGroup mutex; toggle resets to default seed (value=70 or range={70,80}).
4. `RpeField` numeric input with `min=1 max=10 step=0.5`.
5. `PaceField` Select with 4 enum values from `PACE_VALUES` tuple + `PACE_LABELS` map.
6. `HrZoneField` Select with 5 values from `HR_ZONES` tuple.
7. `NumericPaceField` 3 sub-inputs: value `TextField`, distanceUnit `Select` from `NUMERIC_PACE_DISTANCE_UNITS`, paceType `Select` from `NUMERIC_PACE_TYPES` + `PACE_TYPE_LABELS` map.
8. `TimeCapFields` whole-section Switch + min `TextField` + Range Switch + max `TextField` (conditional) + unit `ToggleButtonGroup` from `TIME_CAP_UNITS` (only `min` + `sec`, NO `round`).
9. Barrel `components/index.ts` += 6 alphabetic entries (final state per § 3 Phase 1 above).

### Phase 2 — BlockEditorModal

10. 1 new file `block-editor-modal.tsx` created.
11. Uses `FormModal` from `@repo/ui` as shell.
12. Uses `useForm<BlockEditorFormData>` from `react-hook-form` + `zodResolver(blockEditorFormSchema)`.
13. `blockEditorFormSchema` mirrors `intensitySchema` shape WITHOUT the `≥1 dimension` refine (UI permits zero-dim draft state) + nested `timeCap: timeCapSchema.nullable()`.
14. `toFormData(block)` builds initial form state from `block.intensity` / `block.timeCap`; conditional-spread (`exactOptionalPropertyTypes: true` compliant) preserves only populated dims.
15. `useEffect([block, reset])` re-syncs form state after block prop changes (post-save refetch invariant).
16. `buildIntensityPayload(form.intensity)` returns `Intensity | null`: null when no dims set; otherwise conditional-spread populated dims.
17. `buildTimeCapPayload(form.timeCap)` is identity passthrough (RHF state already in `TimeCap | null` shape).
18. onSubmit single `useUpdateBlock.mutate({blockId, data: {intensity, timeCap}})` call; `onSuccess: () => onClose()`.
19. 5 `Controller`s wrap Field components (effortPercent + rpe + pace + hrZone + numericPace); 1 `Controller` wraps TimeCapFields.
20. Field `disabled` propagated from `updateBlock.isPending`.
21. Barrel += 1 entry `BlockEditorModal` after `BlockCard`.

### Phase 3 — Summary read-display components

22. 2 new files `block-intensity-summary.tsx` + `block-time-cap-summary.tsx`.
23. `BlockIntensitySummary` returns `null` when `intensity === null`; otherwise `Stack` of `Chip` per populated dim.
24. `BlockIntensitySummary` formatters: `formatEffortPercent` (handles value vs range), `formatRpe` ("RPE 8"), `formatHrZone` (zone enum), `formatNumericPace` (value + direction + unit). Pace renders raw enum value (no formatter map needed for read display — accepts coach's domain language).
25. `BlockTimeCapSummary` returns `null` when `timeCap === null`; otherwise 1 `Chip`. `formatTimeCap` handles single (`5 min cap`) vs range (`5-10 min cap`) shapes.
26. Both Summary files: pure functions at module scope (return `string`, NOT JSX) — no `react/no-multi-comp` violation.
27. Barrel += 2 entries `BlockIntensitySummary`, `BlockTimeCapSummary`.

### Phase 4 — BlockCard integration

28. `block-card.tsx` imports `BlockEditorModal`, `BlockIntensitySummary`, `BlockTimeCapSummary`, `EditIcon`.
29. New `editOpen` state adjacent to `menuOpen` + `deleteOpen`.
30. MenuItem "Edit details" with EditIcon adornment inserted **above** "Delete" MenuItem.
31. Chip-row Box renders conditionally (`hasSummary` = `intensity !== null || timeCap !== null`).
32. `<BlockEditorModal>` mounted adjacent to `<ConfirmationModal>`.

### Global verifications

33. `pnpm --filter platform check-types` 16/16 green at every intermediate Phase + final.
34. `pnpm --filter platform lint` 16/16 green with 0 warnings at every intermediate Phase + final. Critical: zero `react/no-multi-comp` or `react/display-name` violations.
35. `pnpm test` baseline preserved (1075 passed; no test deltas; UI components NOT unit-tested per `[[no-tech-debt-in-mocks]]`).
36. `pnpm dep:check` 0 violations, module count delta matches `+9` (5 + 1 + 1 + 2 = 9 new files Phase 1+2+3; Phase 4 modifies existing). Expected count `1192` (baseline `1183` + 9).
37. Husky pre-commit clean on all 4 code commits without `--no-verify` / `--no-edit` / `--no-gpg-sign`.
38. Branch unchanged: `feat/training-domain` (no new branch cut; override per `[[always-via-feature-skill]]` honored).
39. Commit subject conventions verified: ≤ 100 chars, fully lowercase (including module/component names — `blockeditormodal`, `formmodal`, `rhf`). Body lines ≤ 140 chars safety margin.
40. Smoke-test scenario per § 9 below documented + DEFERRED-to-user per `[[no-tech-debt-in-mocks]]` (manual browser test; requires live dev server + DB seed).

---

## § 5. Adversarial pass (7 axes per `[[planner-adversarial-review]]` + `[[planner-lint-impact-trace]]`)

### Axis 1 — Intensity `≥1 dimension` refine vs UI draft state

`intensitySchema` has `.refine(≥1 dim)` — submit-time invariant. UI permits zero-dim draft (all 5 Switches OFF). `buildIntensityPayload` returns `null` when no dims set → `updateBlock.mutate({intensity: null})` is the CORRECT clear path. The Zod `intensitySchema | null` shape in `block.schema.ts` permits null. **No refine violation possible at submit because we never send empty struct — always null or ≥1-dim populated.** Form-level `blockEditorFormSchema` deliberately omits the refine (allows draft state); transform helper enforces null-on-empty.

### Axis 2 — EffortPercent value vs range mutex (internal discriminator)

`effortPercentSchema = z.union([{value}, {range}])`. UI ToggleButtonGroup `mode` state mutex; `handleModeChange` resets to default seed of opposite mode (value=70 / range={70,80}). Form state always exactly one shape; no partial draft (e.g., both `value` and `range` populated) possible because handler replaces wholesale. **Mutex preserved at all transitions.**

### Axis 3 — TimeCap `max > min` refine vs user input order

`timeCapSchema.refine(max === undefined || min < max)`. UI starts with seed `{min:5, max:undefined, unit:"min"}` → coach toggles range ON → seed becomes `{min:5, max:10, unit:"min"}` (delta +5 ensures initial valid). Coach can edit min upward to exceed max OR max downward below min → Zod refine fires at submit; FormModal shows error via Alert. Initial render valid; only user-driven edits can break invariant. **Acceptable; surface via error display, no preemptive UI guard.**

### Axis 4 — Clear-all affordance (intensity:null + timeCap:null in same submit)

Coach scenario: block had intensity + timeCap populated; coach wants to wipe both. Toggle all 5 Intensity Switches OFF + TimeCap Switch OFF → Save. `buildIntensityPayload` returns `null`; `buildTimeCapPayload` returns `null`. `useUpdateBlock.mutate({blockId, data: {intensity: null, timeCap: null}})` sends explicit nulls per `updateBlockSchema = createBlockSchema` permitting `null`. API persists clears; refetch returns `block.intensity === null && block.timeCap === null`; Chip-row Box conditional skips render. **Clear path validated.**

### Axis 5 — Form state sync с incoming block prop after Save

Post-Save: `useWeekMutation` invalidates week query → server returns updated block → BlockCard re-renders with new `block` prop → BlockEditorModal receives new `block` prop. **Critical**: `useForm` `defaultValues` only used on FIRST render; subsequent prop changes do NOT auto-sync. **Solution shipped**: `useEffect([block, reset]) reset(toFormData(block))` re-syncs form state every time block prop reference changes. **Edge case**: if coach opens modal, types changes, then external force re-fetch happens (unlikely — TanStack Query no refetchOnWindowFocus by default; cache stable until invalidation) → effect could wipe coach's unsaved draft. Acceptable trade-off — modal is short-lived; close + reopen on next mount; deliberate save flow.

### Axis 6 — useUpdateBlock partial-update semantics + LWW concurrency

Server `lmsBlockApi.update` (Step 7.1) performs full overwrite on provided fields. Step 7.5 onSubmit sends `{intensity, timeCap}` ONLY (no notes, no labelIds) → server preserves notes + labels untouched. Concurrent edit by another coach session on same block: API uses Serializable tx but no special concurrency handling at HTTP layer — LWW. If parallel sessions both edit, second wins. Acceptable for coach-internal MVP; no multi-coach conflict UX required this scope.

### Axis 7 — Lint-impact mental simulation (9th flavour `[[planner-lint-impact-trace]]`)

Each Phase 1 Field component file = 1 component (the named export). No JSX-returning helpers extracted to module scope — all conditional render JSX inline within the component closure. `react/no-multi-comp` would fire if `renderRange()` / `renderValue()` / similar were extracted; planner kept all conditional branches inline using direct `&&` expressions + nested `<Stack>` wrappers.

Phase 2 BlockEditorModal: helpers `toFormData` / `buildIntensityPayload` / `buildTimeCapPayload` are pure non-JSX functions (return data, not JSX) → safe at module scope. `Controller`'s `render` prop returns JSX BUT is passed inline as a render-prop callback — NOT a module-scope function declaration, so `react/no-multi-comp` doesn't trigger. **Verified safe.**

Phase 3 Summary components: `formatEffortPercent` / `formatRpe` / `formatHrZone` / `formatNumericPace` / `formatTimeCap` are pure string-returning helpers → safe at module scope.

Phase 4 BlockCard: no new helpers; only state additions and JSX additions inline within `BlockCard` component body. `hasSummary` is a boolean derived inline → safe.

**Conclusion**: zero `react/no-multi-comp` risk if executor strictly follows § 3 phase spec. If executor improvises and extracts any `renderX()` JSX helper to module scope inside a Field file → STOP + revert + use inline pattern OR extract to its own component file (per `[[one-component-per-file]]`).

### Adjacent axis (informational; not blocking) — RPE half-step UX

`rpeSchema = {value: z.number().positive().max(10)}` allows any positive number ≤10. Coach convention may use half-steps (7.5 RPE). UI ships `step=0.5` on `RpeField` numeric input — supports half-step entry without forcing integer. Domain doesn't constrain; UI affordance only.

---

## § 6. Commit strategy per `[[husky-cross-package-squash]]`

**Pre-check** (executor verifies at execution start):

- `.husky/pre-commit` runs `turbo check-types --filter="...[HEAD]"` per § 0.B → exercises packages affected by HEAD commit.
- All 4 code phases touch ONLY `apps/platform/` files. Per package-isolation: each Phase commit affects exactly `apps/platform/` → `pnpm turbo check-types --filter="...[HEAD]"` exercises platform only.
- Each Phase's intermediate tree compiles + lints clean per § 3 verification gates.
- **No cross-package broken trees** → no squash needed. **Per-layer atomic = correct strategy.**

**Final commit chain** (5 commits total):

1. Phase 1: `feat(platform): add intensity and timecap field components for block editor`
2. Phase 2: `feat(platform): add blockeditormodal with rhf + zod resolver for intensity and timecap`
3. Phase 3: `feat(platform): add chip-row read display for block intensity and timecap`
4. Phase 4: `feat(platform): integrate intensity timecap edit modal and chip summary into blockcard`
5. Phase 5: `docs(step-07.5): write executor output report`

**Branch override** (mandatory per `[[always-via-feature-skill]]`): all 5 commits land on `feat/training-domain`; **NO `feat/<slug>` cut**. If `/feature` Stage 0 prompts to cut a branch — refuse and stay on existing branch.

---

## § 7. Verification commands + expected ranges

Run from repo root after Phase 4 ships (full pre-flight before Phase 5 output.md write):

```bash
# Type-check (must be 16/16; expect FULL TURBO cache hit on unaffected packages after Phase 1+2+3 cache warm)
pnpm check-types

# Lint (must be 16/16, 0 warnings; --max-warnings 0 enforced in @repo/ui + apps/platform)
pnpm lint

# Tests (baseline preserved 1075 passed; zero UI component tests per [[no-tech-debt-in-mocks]])
pnpm test

# Dep-cruiser (0 violations; module count +9 vs Step 7.4 baseline 1183 → expected 1192)
pnpm dep:check

# Verify no symbol leakage in unintended places
grep -rn "BlockEditorModal\|BlockIntensitySummary\|BlockTimeCapSummary" apps/platform/src/
# Expected: 3 component definitions + 3 imports in block-card.tsx + 3 barrel re-exports = 9 hits total

# Verify TIME_CAP_UNITS not literally substituted anywhere with stale "round"
grep -rn "TIME_CAP_UNITS\|time_cap_units" apps/platform/src/
# Expected: 1 import in time-cap-fields.tsx (Phase 1.6) only

# Verify branch unchanged
git rev-parse --abbrev-ref HEAD
# Expected: feat/training-domain
```

If any verification fails — STOP, surface via `AskUserQuestion`, do NOT silently amend or proceed.

---

## § 8. Carry-forwards (existing + Step-7.5-surfaced)

### Pre-existing (10 from Step 7.4 close, unchanged in Step 7.5)

- **QA-001b** Session `@@unique([dayId, order])` mirror + `lmsSessionApi.reorder` two-pass rewrite (pre-Step-8 cleanup recommended).
- **QA-001c** `retryOnP2034` widening to also retry P2002 on `_max+N` insert pattern (INFO; Step 7.x or pre-Step-8).
- **QA-023** Flaky timing-proxy assertion in `block/admin.test.ts:406` (case 11; threshold 50ms too tight; fix options: widen to 200ms / vi.spyOn / internal logging). NOT blocker; pick at Step 7.5 OR separate `/fix` loop.
- **WORKFLOW-001** `db:seed` vs test suite incompatibility (`idx_single_head_coach`). Workflow surface; planner action separate.
- **`DAY_INCLUDE` hoist** to shared `endpoints/lms/_shared/day-include.ts` (Step 8 Schema entity trigger).
- **`BLOCK_WITH_LABELS_INCLUDE` hoist** to shared module (Step 8 trigger).
- **`mapToBlockWithSchemas` mapper** (Step 8 Schema entity).
- **QA-006** HEAD_COACH + ARCHIVED composition test (INFO optional).
- **QA-019** D-7 invariant outcome-only test (accepted per `[[no-tech-debt-in-mocks]]`).
- **QA-022** `TxClient` Omit deny-list fragile к Prisma upgrades (flag для `/upgrade @prisma/client` prompts).
- **Symbol rename** `cms{Label,Exercise}AdminApi` → `lms*` (Step 6.1.5 deferred, low priority).

### Potential new from Step 7.5 (surface at execution; report in output.md if materialized)

- **No anticipated NEW carry-forwards.** Step 7.5 is pure consumer-side UI surface — no contract changes, no schema changes, no shared mappers. If executor surfaces deviations or unexpected lint/dep-check findings → record in output.md Q-/D-decisions per WORKFLOW.md `output.md format`.

### CLOSED по Step 7.5

- **Step 7.0 D-2 affordances** (5 standalone Zod sub-schemas + 4 `as const` tuples) — consumed by Phase 1 Field components + Phase 2 BlockEditorModal.
- **Step 7.4 E2 commitment** (Intensity + TimeCap UI both edit + read display) — closed by Phase 2 (edit) + Phase 3+4 (read display + integration).
- **OQ (b) UI surface placement** — closed by B1 (single FormModal Edit-block).
- **OQ (c) Intensity multi-dim toggle UX** — closed by C1 (per-dim Switch + conditional reveal).
- **OQ (d) TimeCap field shape** — closed by D1 (max Toggle + unit ToggleButtonGroup).
- **OQ (e) Read-display format** — closed by E1 (Chip-row above Menu, conditional render when non-null).
- **OQ (f) `useBlurCommit` for numeric Intensity fields** — closed by N/A (RHF Controllers + Save submit; no per-field blur-commit).
- **OQ (h) Coach validation-gate framing** — refined per memory entry update: Option 1 (Step 8 Schema editor) locked; mini-gate framing wrong; validation works after meaningful content surface ships.

---

## § 9. Smoke-test scenario (manual, ~18 steps; deferred to user per `[[no-tech-debt-in-mocks]]`)

**Preconditions**:

1. DB clean state: `pnpm --filter @repo/api-server db:reset` (does NOT auto-seed per ADR-0019).
2. Seed minimal training data: `pnpm --filter @repo/api-server db:seed` (1 coach, 1 athlete, 1 empty plan, 34 archetypes).
3. Admin-create 2 BLOCK-applicable labels (`pnpm dev:admin` → http://localhost:3002 → log in as coach → Labels → create "endurance" + "strength" with `applicableLevels` including `BLOCK`).
4. Platform dev server: `pnpm dev:platform` → http://localhost:3001.
5. Log in as coach; navigate to `/coach/plans` → open the seeded plan → navigate to current calendar week.
6. Materialize at least 1 Day (set a Day label OR create a Session via "Add session" Button); inside Session, click "Add block" → 1 empty Block lands.

**Scenario steps** (18 numbered with expected results + rollback):

1. **Block read display empty**: BlockCard shows drag handle + multi-label autocomplete + notes field + kebab. **No Chip row visible** (both intensity + timeCap = null). ✅
2. **Open kebab**: click "Block actions" kebab → Menu opens with 2 items: "Edit details" (with EditIcon) + "Delete" (with DeleteIcon, red). ✅
3. **Open Edit details**: click "Edit details" → BlockEditorModal opens with title "Edit block details". 5 Intensity Switches all OFF + 1 TimeCap Switch OFF + Save/Cancel actions. ✅
4. **Submit empty**: click Save with no changes → submission succeeds (sends `{intensity: null, timeCap: null}` no-op). Modal closes. ✅
5. **Reopen + set Effort single**: kebab → Edit details → toggle "Effort %" Switch ON → Mode toggle defaults to "Single" → input shows "70". Save → Modal closes → Chip "70% effort" appears in Chip row above kebab. ✅
6. **Reopen + change Effort to range**: Open modal → "Effort %" already ON with value=70 → Mode toggle to "Range" → seed values min=70, max=80 → Save → Chip updates to "70-80% effort". ✅
7. **Add RPE**: Open modal → toggle "RPE" Switch ON → value=7 → Save → Chip row now shows "70-80% effort" + "RPE 7" (2 Chips, wrap-flex). ✅
8. **Add Pace**: Open modal → toggle "Pace" ON → Select "easy" → Save → Chip row += "easy" Chip (3 Chips). ✅
9. **Add HR Zone**: Open modal → toggle "HR Zone" ON → Select "Z3" → Save → Chip row += "Z3" Chip (4 Chips). ✅
10. **Add Numeric Pace**: Open modal → toggle "Numeric pace" ON → value="1:50", Distance="km", Direction="min/distance" → Save → Chip row += "1:50/km" Chip (5 Chips). ✅
11. **Add TimeCap single**: Open modal → toggle "Time cap" ON → seed min=5, unit=min → Save → New `BlockTimeCapSummary` Chip "5 min cap" appears at end of Chip row (6 total Chips). ✅
12. **Add TimeCap range**: Open modal → "Time cap" already ON → toggle "Add range max" ON → seed max=10 → Save → Chip updates to "5-10 min cap". ✅
13. **Switch TimeCap unit to sec**: Open modal → "Time cap" ON → ToggleButtonGroup click "sec" → Save → Chip updates to "5-10 sec cap". ✅
14. **Invalid TimeCap (max < min)**: Open modal → set min=20 (max remains 10) → Save → FormModal Alert shows refine error "timeCap.max must be > min when set". Modal stays open. ✅
15. **Fix invalid + Save**: Edit max=30 → Save → Chip updates to "20-30 sec cap". Modal closes. ✅
16. **Clear single dimension**: Open modal → toggle "Pace" Switch OFF → Save → Chip row drops "easy" Chip; remaining 5 Chips preserved. ✅
17. **Clear-all Intensity**: Open modal → toggle all 5 Intensity Switches OFF (keep TimeCap on) → Save → All Intensity Chips disappear; only "20-30 sec cap" remains. ✅
18. **Clear-all both**: Open modal → toggle TimeCap Switch OFF → Save → All Chips disappear; entire Chip row Box no longer renders (hasSummary === false). BlockCard layout returns to original Step 7.4 shape. ✅

**Concurrency smoke (optional)**: open 2 browser tabs as same coach; tab1 sets RPE=8; tab2 (cached week) opens Edit → sees old empty state → sets Effort=50 + saves → server LWW preserves tab2 write only (RPE=undefined again). Refresh tab1 → sees only Effort=50. Acceptable per Axis 6 LWW.

**Rollback**: revert all blocks to null intensity + null timeCap (Open modal → all Switches OFF → Save) OR `pnpm --filter @repo/api-server db:reset` to clear all data.

---

## End of prompt

**Executor handoff**: read this prompt start-to-finish; run § 0 verbatim verifications + § 0.A greps; STOP-and-surface on any drift; execute Phases 1-4 sequentially with verification gates between; ship 4 atomic code commits + 1 docs commit; write `implementation/step-07.5/output.md` per WORKFLOW.md § "output.md format". Branch override mandatory; pipeline `/feature` full; husky hooks must pass clean without `--no-verify`.

After executor ships → user reports → planner reads output.md + `.feature-dev/<ts>/` artifacts + spot-checks + validates → smoke-test scenario user-executes manually per § 9 → planner closes step (IMPLEMENTATION_LOG newest-first entry + PLANNING_STATE updates including Next action shift to Step 8 thesis cycle) + 3 docs commits (`docs(step-07.5)` already present from Phase 5; planner adds `docs(workflow)` only if new 10th flavour surfaces + `docs(planning)`).
