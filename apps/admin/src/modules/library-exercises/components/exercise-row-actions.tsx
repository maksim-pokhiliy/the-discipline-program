"use client";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MergeTypeIcon from "@mui/icons-material/MergeType";
import { IconButton, Stack, Tooltip } from "@mui/material";
import Link from "next/link";

import { ExerciseStatus, type ExerciseListItem } from "@repo/contracts/library/exercise";

type ExerciseRowActionsProps = {
  exercise: ExerciseListItem;
  onApprove: (id: string) => void;
  onReject: (exercise: ExerciseListItem) => void;
  onMerge: (exercise: ExerciseListItem) => void;
  onDelete: (id: string) => void;
};

export const ExerciseRowActions = ({
  exercise,
  onApprove,
  onReject,
  onMerge,
  onDelete,
}: ExerciseRowActionsProps) => {
  const isPending = exercise.status === ExerciseStatus.PENDING_REVIEW;
  const isApproved = exercise.status === ExerciseStatus.APPROVED;

  return (
    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
      <Tooltip title="Edit">
        <IconButton
          component={Link}
          href={`/library/exercises/${exercise.id}`}
          color="primary"
          aria-label="Edit"
          size="small"
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {isPending && (
        <>
          <Tooltip title="Approve">
            <IconButton
              color="success"
              aria-label="Approve"
              size="small"
              onClick={() => onApprove(exercise.id)}
            >
              <CheckIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reject">
            <IconButton
              color="warning"
              aria-label="Reject"
              size="small"
              onClick={() => onReject(exercise)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}

      {isApproved && (
        <Tooltip title="Merge">
          <IconButton aria-label="Merge" size="small" onClick={() => onMerge(exercise)}>
            <MergeTypeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title="Delete">
        <IconButton
          color="error"
          aria-label="Delete"
          size="small"
          onClick={() => onDelete(exercise.id)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};
