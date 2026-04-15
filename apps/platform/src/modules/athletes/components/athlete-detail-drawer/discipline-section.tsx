"use client";

import { useMemo } from "react";

import { Chip, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";

import type { PlanDiscipline } from "@repo/contracts/coaching/coach-athletes";
import { PLAN_ENROLLMENT_STATUS_LABELS } from "@repo/contracts/lms/plan-enrollment";
import { rateToPercent } from "@repo/shared";

import { ENROLLMENT_STATUS_COLORS } from "@app/lib/config";

type DisciplineSectionProps = {
  planDiscipline: PlanDiscipline[];
};

export const DisciplineSection: React.FC<DisciplineSectionProps> = ({ planDiscipline }) => {
  const aggregate = useMemo(() => {
    let completed = 0;
    let available = 0;
    let planned = 0;

    for (const p of planDiscipline) {
      completed += p.completed;
      available += p.available;
      planned += p.planned;
    }

    return { completed, available, planned };
  }, [planDiscipline]);

  if (planDiscipline.length === 0) {
    return null;
  }

  const progress =
    aggregate.planned > 0 ? rateToPercent(aggregate.completed / aggregate.planned) : 0;
  const hasMultiplePlans = planDiscipline.length > 1;
  const remaining = aggregate.planned - aggregate.available;

  return (
    <Stack spacing={1.5} sx={{ p: 2.5 }}>
      <Typography variant="subtitle2">Weekly Discipline</Typography>

      <Stack spacing={1}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title={`${aggregate.completed} of ${aggregate.planned} this week`} arrow>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={(theme) => ({ height: theme.spacing(0.75), borderRadius: 1, flex: 1 })}
            />
          </Tooltip>
          <Typography variant="subtitle2" sx={{ whiteSpace: "nowrap" }}>
            {aggregate.completed}/{aggregate.planned}
          </Typography>
        </Stack>

        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {aggregate.completed} of {aggregate.available} available done
          {remaining > 0 && ` · ${remaining} upcoming`}
        </Typography>
      </Stack>

      {hasMultiplePlans && (
        <Stack spacing={0.75} sx={{ pl: 1 }}>
          {planDiscipline.map((plan) => (
            <Stack key={plan.planId} direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" noWrap sx={{ flex: 1, color: "text.secondary" }}>
                {plan.planName}
              </Typography>
              <Chip
                size="small"
                label={PLAN_ENROLLMENT_STATUS_LABELS[plan.enrollmentStatus]}
                color={ENROLLMENT_STATUS_COLORS[plan.enrollmentStatus]}
                variant="outlined"
              />
              <Typography variant="caption" sx={{ whiteSpace: "nowrap" }}>
                {plan.completed}/{plan.planned}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
};
