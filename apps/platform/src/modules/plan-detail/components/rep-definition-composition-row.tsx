"use client";

import CloseIcon from "@mui/icons-material/Close";
import { IconButton, Stack, Typography } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { ExerciseId } from "./exercise-form-draft.types";
import { ExercisePicker } from "./exercise-picker";
import { NumberField } from "./number-field";

const REMOVE_ELEMENT_LABEL = "Remove element";
const TIMES_SEPARATOR = "×";
const COUNT_MIN = 1;
const COUNT_FIELD_MAX_WIDTH = 88;

type RepDefinitionCompositionValue = {
  exerciseId: ExerciseId;
  count: number;
};

type RepDefinitionCompositionRowProps = {
  value: RepDefinitionCompositionValue;
  onChange: (next: RepDefinitionCompositionValue) => void;
  onRemove: () => void;
  canRemove: boolean;
  error?: FieldErrors<{ exerciseId: string; count: number }> | undefined;
  disabled?: boolean;
};

export const RepDefinitionCompositionRow = ({
  value,
  onChange,
  onRemove,
  canRemove,
  error,
  disabled = false,
}: RepDefinitionCompositionRowProps) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
    <NumberField
      value={value.count}
      onChange={(count) => onChange({ ...value, count })}
      min={COUNT_MIN}
      maxWidth={COUNT_FIELD_MAX_WIDTH}
      error={error?.count?.message}
      disabled={disabled}
    />

    <Typography variant="caption" color="text.subtle">
      {TIMES_SEPARATOR}
    </Typography>

    <ExercisePicker
      compact
      value={value.exerciseId}
      onChange={(id) => onChange({ ...value, exerciseId: id })}
      error={error?.exerciseId !== undefined}
      disabled={disabled}
    />

    <IconButton
      aria-label={REMOVE_ELEMENT_LABEL}
      size="small"
      onClick={onRemove}
      disabled={disabled || !canRemove}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  </Stack>
);
