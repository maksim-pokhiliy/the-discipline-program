"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Card, IconButton, Stack, Typography } from "@mui/material";

import { ExercisePicker } from "./exercise-picker";

const REMOVE_LABEL = "Remove exercise";

type ExerciseRefFieldProps = {
  label: React.ReactNode;
  value: string | null;
  onChange: (id: string | null) => void;
  error?: boolean;
  disabled?: boolean;
  onRemove?: (() => void) | undefined;
  canRemove?: boolean;
};

export const ExerciseRefField = ({
  label,
  value,
  onChange,
  error = false,
  disabled = false,
  onRemove,
  canRemove = true,
}: ExerciseRefFieldProps) => (
  <Card variant="outlined" sx={(theme) => ({ p: theme.spacing(1.5) })}>
    <Stack spacing={1}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography variant="caption" color="text.subtle">
          {label}
        </Typography>

        {onRemove !== undefined && (
          <IconButton
            aria-label={REMOVE_LABEL}
            size="small"
            onClick={onRemove}
            disabled={disabled || !canRemove}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      <ExercisePicker compact value={value} onChange={onChange} error={error} disabled={disabled} />
    </Stack>
  </Card>
);
