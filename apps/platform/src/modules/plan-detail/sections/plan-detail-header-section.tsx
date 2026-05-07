"use client";

import { Stack } from "@mui/material";

import { type TrainingPlan } from "@repo/contracts/lms/training-plan";
import { PageHeader } from "@repo/ui";

import { PlanStatusChip } from "@app/modules/plans/components";

const BACK_HREF = "/coach/plans";

type PlanDetailHeaderSectionProps = { plan: TrainingPlan };

export const PlanDetailHeaderSection: React.FC<PlanDetailHeaderSectionProps> = ({ plan }) => (
  <PageHeader
    title={plan.name}
    backHref={BACK_HREF}
    actions={
      <Stack direction="row" spacing={1} alignItems="center">
        <PlanStatusChip status={plan.status} />
      </Stack>
    }
  />
);
