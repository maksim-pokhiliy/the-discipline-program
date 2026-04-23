"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { IconButton, Stack, Tooltip } from "@mui/material";

import { type ExerciseListItem, ExerciseStatus } from "@repo/contracts/library/exercise";

type ExerciseRowActionsProps = {
  exercise: ExerciseListItem;
  onEdit: (exercise: ExerciseListItem) => void;
  onDelete: (exercise: ExerciseListItem) => void;
};

export const ExerciseRowActions = ({ exercise, onEdit, onDelete }: ExerciseRowActionsProps) => {
  const canModify = exercise.status === ExerciseStatus.PENDING_REVIEW;

  if (!canModify) {
    return null;
  }

  return (
    <Stack direction="row" spacing={1} justifyContent="flex-end">
      <Tooltip title="Edit">
        <IconButton onClick={() => onEdit(exercise)} color="primary" aria-label="Edit">
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton onClick={() => onDelete(exercise)} color="error" aria-label="Delete">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};
