"use client";

import { Button, type ButtonProps, Chip, Stack } from "@mui/material";

import { TRAINING_PLAN_STATUS_LABELS, TrainingPlanStatus } from "@repo/contracts/training-plan";

import { PLAN_STATUS_COLORS } from "@app/lib/config";
import {
  useActivateTrainingPlan,
  useArchiveTrainingPlan,
  useRestoreTrainingPlan,
} from "@app/lib/hooks";

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

  const mutations: Record<TrainingPlanStatus, (id: string) => void> = {
    [TrainingPlanStatus.DRAFT]: (id) => activate.mutate(id),
    [TrainingPlanStatus.ACTIVE]: (id) => archive.mutate(id),
    [TrainingPlanStatus.ARCHIVED]: (id) => restore.mutate(id),
  };

  const handleClick = () => {
    mutations[status](planId);
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Chip
        variant="outlined"
        size="small"
        label={TRAINING_PLAN_STATUS_LABELS[status]}
        color={PLAN_STATUS_COLORS[status]}
      />

      <Button size="small" color={action.color} onClick={handleClick} disabled={isPending}>
        {action.label}
      </Button>
    </Stack>
  );
};
