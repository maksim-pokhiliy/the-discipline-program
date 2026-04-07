"use client";

import { Button, type ButtonProps, Chip, type ChipProps, Stack } from "@mui/material";

import { TRAINING_PLAN_STATUS_LABELS, TrainingPlanStatus } from "@repo/contracts/training-plan";

import {
  useActivateTrainingPlan,
  useArchiveTrainingPlan,
  useRestoreTrainingPlan,
} from "@app/lib/hooks";

const STATUS_COLORS: Record<TrainingPlanStatus, ChipProps["color"]> = {
  [TrainingPlanStatus.DRAFT]: "default",
  [TrainingPlanStatus.ACTIVE]: "success",
  [TrainingPlanStatus.ARCHIVED]: "warning",
};

type ActionConfig = {
  label: string;
  target: TrainingPlanStatus;
  color: ButtonProps["color"];
};

const STATUS_ACTIONS: Record<TrainingPlanStatus, ActionConfig> = {
  [TrainingPlanStatus.DRAFT]: {
    label: "Publish",
    target: TrainingPlanStatus.ACTIVE,
    color: "success",
  },
  [TrainingPlanStatus.ACTIVE]: {
    label: "Archive",
    target: TrainingPlanStatus.ARCHIVED,
    color: "warning",
  },
  [TrainingPlanStatus.ARCHIVED]: {
    label: "Restore",
    target: TrainingPlanStatus.ACTIVE,
    color: "success",
  },
};

type PlanStatusSelectProps = {
  planId: string;
  status: TrainingPlanStatus;
};

export const PlanStatusSelect: React.FC<PlanStatusSelectProps> = ({ planId, status }) => {
  const activate = useActivateTrainingPlan();
  const archive = useArchiveTrainingPlan();
  const restore = useRestoreTrainingPlan();

  const isPending = activate.isPending || archive.isPending || restore.isPending;
  const action = STATUS_ACTIONS[status];

  const MUTATION_MAP: Record<
    TrainingPlanStatus,
    Record<TrainingPlanStatus, (id: string) => void>
  > = {
    [TrainingPlanStatus.DRAFT]: {
      [TrainingPlanStatus.DRAFT]: () => {},
      [TrainingPlanStatus.ACTIVE]: (id) => activate.mutate(id),
      [TrainingPlanStatus.ARCHIVED]: (id) => archive.mutate(id),
    },
    [TrainingPlanStatus.ACTIVE]: {
      [TrainingPlanStatus.DRAFT]: () => {},
      [TrainingPlanStatus.ACTIVE]: () => {},
      [TrainingPlanStatus.ARCHIVED]: (id) => archive.mutate(id),
    },
    [TrainingPlanStatus.ARCHIVED]: {
      [TrainingPlanStatus.DRAFT]: () => {},
      [TrainingPlanStatus.ACTIVE]: (id) => restore.mutate(id),
      [TrainingPlanStatus.ARCHIVED]: () => {},
    },
  };

  const handleClick = () => {
    MUTATION_MAP[status][action.target](planId);
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Chip
        variant="outlined"
        size="small"
        label={TRAINING_PLAN_STATUS_LABELS[status]}
        color={STATUS_COLORS[status]}
      />

      <Button size="small" color={action.color} onClick={handleClick} disabled={isPending}>
        {action.label}
      </Button>
    </Stack>
  );
};
