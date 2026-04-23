import { type ChipProps } from "@mui/material";

import {
  EXERCISE_STATUS_LABELS,
  ExerciseStatus,
  MEASUREMENT_UNIT_LABELS,
  MeasurementUnit,
} from "@repo/contracts/library/exercise";

export const EXERCISE_STATUS_CONFIG: Record<
  ExerciseStatus,
  { label: string; color: ChipProps["color"] }
> = {
  [ExerciseStatus.PENDING_REVIEW]: {
    label: EXERCISE_STATUS_LABELS.PENDING_REVIEW,
    color: "warning",
  },
  [ExerciseStatus.APPROVED]: {
    label: EXERCISE_STATUS_LABELS.APPROVED,
    color: "success",
  },
  [ExerciseStatus.REJECTED]: {
    label: EXERCISE_STATUS_LABELS.REJECTED,
    color: "error",
  },
  [ExerciseStatus.MERGED]: {
    label: EXERCISE_STATUS_LABELS.MERGED,
    color: "default",
  },
};

export const MEASUREMENT_UNIT_OPTIONS: { value: MeasurementUnit; label: string }[] = Object.values(
  MeasurementUnit,
).map((unit) => ({ value: unit, label: MEASUREMENT_UNIT_LABELS[unit] }));
