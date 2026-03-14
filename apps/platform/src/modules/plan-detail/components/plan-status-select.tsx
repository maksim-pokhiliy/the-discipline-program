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

  const handleClick = () => {
    const mutate =
      action.target === TrainingPlanStatus.ACTIVE && status === TrainingPlanStatus.DRAFT
        ? activate.mutate
        : action.target === TrainingPlanStatus.ARCHIVED
          ? archive.mutate
          : restore.mutate;

    mutate(planId);
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Chip
        variant="outlined"
        size="small"
        label={TRAINING_PLAN_STATUS_LABELS[status]}
        color={STATUS_COLORS[status]}
      />

      <Button
        size="small"
        variant="outlined"
        color={action.color}
        onClick={handleClick}
        disabled={isPending}
      >
        {action.label}
      </Button>
    </Stack>
  );
};
