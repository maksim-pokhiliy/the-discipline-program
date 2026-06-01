"use client";

import CloseIcon from "@mui/icons-material/Close";
import { IconButton, Stack, Typography } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { PerSetSubstitutionAssignment } from "@repo/contracts/lms/_shared";

import { ExercisePicker } from "./exercise-picker";
import type { PerSetSubstitutionAssignmentDraft } from "./row-payload-draft.types";

const REMOVE_ASSIGNMENT_LABEL = "Remove assignment";
const SET_LABEL_PREFIX = "set";

type PerSetAssignmentRowProps = {
  value: PerSetSubstitutionAssignmentDraft;
  onChange: (next: PerSetSubstitutionAssignmentDraft) => void;
  onRemove: () => void;
  canRemove: boolean;
  error?: FieldErrors<PerSetSubstitutionAssignment> | undefined;
  disabled?: boolean;
};

export const PerSetAssignmentRow = ({
  value,
  onChange,
  onRemove,
  canRemove,
  error,
  disabled = false,
}: PerSetAssignmentRowProps) => {
  const hasPickerError = error?.exerciseId !== undefined || error?.root !== undefined;

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Typography variant="caption" color="text.subtle" sx={{ whiteSpace: "nowrap" }}>
        {`${SET_LABEL_PREFIX} ${value.setIndex}:`}
      </Typography>

      <ExercisePicker
        compact
        value={value.exerciseId}
        onChange={(id) => onChange({ ...value, exerciseId: id })}
        error={hasPickerError}
        disabled={disabled}
      />

      <IconButton
        aria-label={REMOVE_ASSIGNMENT_LABEL}
        size="small"
        onClick={onRemove}
        disabled={disabled || !canRemove}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
};
