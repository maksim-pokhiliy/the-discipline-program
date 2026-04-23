"use client";

import { Chip, type ChipProps } from "@mui/material";

import { EXERCISE_STATUS_LABELS, ExerciseStatus } from "@repo/contracts/library/exercise";

const STATUS_COLOR: Record<ExerciseStatus, ChipProps["color"]> = {
  [ExerciseStatus.PENDING_REVIEW]: "warning",
  [ExerciseStatus.APPROVED]: "success",
  [ExerciseStatus.REJECTED]: "error",
  [ExerciseStatus.MERGED]: "default",
};

type ExerciseStatusChipProps = {
  status: ExerciseStatus;
  size?: ChipProps["size"];
};

export const ExerciseStatusChip = ({ status, size = "small" }: ExerciseStatusChipProps) => (
  <Chip
    label={EXERCISE_STATUS_LABELS[status]}
    color={STATUS_COLOR[status]}
    size={size}
    variant="outlined"
  />
);
