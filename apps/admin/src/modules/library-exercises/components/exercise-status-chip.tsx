import { Chip } from "@mui/material";

import { type ExerciseStatus } from "@repo/contracts/library/exercise";

import { EXERCISE_STATUS_CONFIG } from "../constants";

type ExerciseStatusChipProps = {
  status: ExerciseStatus;
};

export const ExerciseStatusChip = ({ status }: ExerciseStatusChipProps) => {
  const config = EXERCISE_STATUS_CONFIG[status];

  return <Chip label={config.label} color={config.color} size="small" variant="outlined" />;
};
