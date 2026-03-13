"use client";

import { useState } from "react";

import { Chip, type ChipProps, Menu, MenuItem } from "@mui/material";

import { TRAINING_PLAN_STATUS_LABELS, TrainingPlanStatus } from "@repo/contracts/training-plan";
import { ConfirmationModal } from "@repo/ui";

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

const ALLOWED_TRANSITIONS: Record<TrainingPlanStatus, TrainingPlanStatus[]> = {
  [TrainingPlanStatus.DRAFT]: [TrainingPlanStatus.ACTIVE],
  [TrainingPlanStatus.ACTIVE]: [TrainingPlanStatus.ARCHIVED],
  [TrainingPlanStatus.ARCHIVED]: [TrainingPlanStatus.ACTIVE],
};

type PlanStatusSelectProps = {
  planId: string;
  status: TrainingPlanStatus;
};

export const PlanStatusSelect: React.FC<PlanStatusSelectProps> = ({ planId, status }) => {
  const activate = useActivateTrainingPlan();
  const archive = useArchiveTrainingPlan();
  const restore = useRestoreTrainingPlan();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [pendingStatus, setPendingStatus] = useState<TrainingPlanStatus | null>(null);

  const isPending = activate.isPending || archive.isPending || restore.isPending;
  const targets = ALLOWED_TRANSITIONS[status];

  const handleSelect = (target: TrainingPlanStatus) => {
    setAnchorEl(null);
    setPendingStatus(target);
  };

  const handleConfirm = () => {
    if (!pendingStatus) {
      return;
    }

    const mutate =
      pendingStatus === TrainingPlanStatus.ACTIVE && status === TrainingPlanStatus.DRAFT
        ? activate.mutate
        : pendingStatus === TrainingPlanStatus.ARCHIVED
          ? archive.mutate
          : restore.mutate;

    mutate(planId, { onSettled: () => setPendingStatus(null) });
  };

  return (
    <>
      <Chip
        size="small"
        label={TRAINING_PLAN_STATUS_LABELS[status]}
        color={STATUS_COLORS[status]}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ cursor: "pointer" }}
      />

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {targets.map((target) => (
          <MenuItem key={target} onClick={() => handleSelect(target)}>
            {TRAINING_PLAN_STATUS_LABELS[target]}
          </MenuItem>
        ))}
      </Menu>

      <ConfirmationModal
        open={Boolean(pendingStatus)}
        onClose={() => setPendingStatus(null)}
        title="Change Plan Status"
        message={
          pendingStatus
            ? `Change status from "${TRAINING_PLAN_STATUS_LABELS[status]}" to "${TRAINING_PLAN_STATUS_LABELS[pendingStatus]}"?`
            : ""
        }
        confirmText="Change Status"
        type="warning"
        isConfirming={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
};
