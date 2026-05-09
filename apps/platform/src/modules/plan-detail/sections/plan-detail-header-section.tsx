"use client";

import { Stack } from "@mui/material";

import { type TrainingPlan } from "@repo/contracts/lms/training-plan";
import {
  PageHeader,
  PlanEditorSaveIndicator,
  PlanStatusChip,
  type SaveIndicatorStatus,
} from "@repo/ui";

const BACK_HREF = "/coach/plans";

type PlanDetailHeaderSectionProps = {
  plan: TrainingPlan;
  saveStatus: SaveIndicatorStatus;
  onRetry?: () => void;
  errorMessage?: string;
};

export const PlanDetailHeaderSection: React.FC<PlanDetailHeaderSectionProps> = ({
  plan,
  saveStatus,
  onRetry,
  errorMessage,
}) => (
  <PageHeader
    title={plan.name}
    backHref={BACK_HREF}
    actions={
      <Stack direction="row" spacing={1} alignItems="center">
        <PlanStatusChip status={plan.status} />
        <PlanEditorSaveIndicator
          status={saveStatus}
          {...(onRetry !== undefined ? { onRetry } : {})}
          {...(errorMessage !== undefined ? { errorMessage } : {})}
        />
      </Stack>
    }
  />
);
