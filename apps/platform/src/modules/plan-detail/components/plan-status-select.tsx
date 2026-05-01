"use client";

import { useState } from "react";

import { Button, type ButtonProps, Chip, Stack } from "@mui/material";

import { TRAINING_PLAN_STATUS_LABELS, TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { ConfirmationModal } from "@repo/ui";

import { PLAN_STATUS_COLORS } from "@app/lib/config";
import {
  useActivateTrainingPlan,
  useArchiveTrainingPlan,
  useRestoreTrainingPlan,
} from "@app/lib/hooks";

type ActionConfig = {
  label: string;
  target: TrainingPlanStatus;
  color: NonNullable<ButtonProps["color"]>;
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
  planName: string;
  status: TrainingPlanStatus;
};

export const PlanStatusSelect: React.FC<PlanStatusSelectProps> = ({ planId, planName, status }) => {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const activate = useActivateTrainingPlan();
  const archive = useArchiveTrainingPlan();
  const restore = useRestoreTrainingPlan();

  const isPending = activate.isPending || archive.isPending || restore.isPending;
  const action = STATUS_ACTIONS[status];

  const handleClick = () => {
    switch (status) {
      case TrainingPlanStatus.DRAFT:
        return activate.mutate(planId);
      case TrainingPlanStatus.ACTIVE:
        return setArchiveOpen(true);
      case TrainingPlanStatus.ARCHIVED:
        return restore.mutate(planId);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
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

      <ConfirmationModal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archive Training Plan"
        type="danger"
        message={`Are you sure you want to archive "${planName}"?`}
        details="Archived plans are no longer visible to athletes. You can restore it later."
        confirmText="Archive"
        isConfirming={archive.isPending}
        onConfirm={() =>
          archive.mutateAsync(planId).then(
            () => setArchiveOpen(false),
            () => undefined,
          )
        }
      />
    </>
  );
};
