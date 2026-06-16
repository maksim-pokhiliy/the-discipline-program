"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { LinearProgress, Stack, Typography } from "@mui/material";
import Link from "next/link";

import type { PlanDiscipline } from "@repo/contracts/coaching/coach-athletes";
import { rateToPercent } from "@repo/shared";

const NO_PLAN_LABEL = "No active plan assigned.";
const PROGRESS_BAR_HEIGHT = 0.75;

type PlanPaneProps = {
  planDiscipline: PlanDiscipline[];
  currentWeek: number | null;
  totalWeeks: number;
};

const formatWeek = (currentWeek: number | null, totalWeeks: number): string | null => {
  if (currentWeek === null) {
    return totalWeeks > 0 ? `${totalWeeks} weeks` : null;
  }

  return totalWeeks > 0 ? `Week ${currentWeek} / ${totalWeeks}` : `Week ${currentWeek}`;
};

export const PlanPane: React.FC<PlanPaneProps> = ({ planDiscipline, currentWeek, totalWeeks }) => {
  if (planDiscipline.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.muted", fontStyle: "italic" }}>
        {NO_PLAN_LABEL}
      </Typography>
    );
  }

  const isSinglePlan = planDiscipline.length === 1;
  const weekLabel = isSinglePlan ? formatWeek(currentWeek, totalWeeks) : null;

  return (
    <Stack spacing={2}>
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        Active plans
      </Typography>

      {planDiscipline.map((plan) => {
        const progress = plan.planned > 0 ? rateToPercent(plan.completed / plan.planned) : 0;

        return (
          <Stack
            key={plan.planId}
            component={Link}
            href={`/coach/plans/${plan.planId}`}
            spacing={1}
            sx={(theme) => ({
              p: 1.5,
              borderRadius: theme.spacing(0.5),
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.default,
              textDecoration: "none",
              color: "inherit",
              transition: theme.transitions.create("border-color"),
              "&:hover": { borderColor: theme.palette.primary.main },
            })}
          >
            <Typography variant="h5" noWrap sx={{ color: "text.primary" }}>
              {plan.planName}
            </Typography>

            {weekLabel !== null && (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
              >
                {weekLabel}
              </Typography>
            )}

            <Stack direction="row" spacing={1.5} alignItems="center">
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={(theme) => ({
                  height: theme.spacing(PROGRESS_BAR_HEIGHT),
                  borderRadius: 1,
                  flex: 1,
                })}
              />
              <Typography
                variant="subtitle2"
                sx={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
              >
                {plan.completed}/{plan.planned}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "primary.main" }}>
              <Typography variant="overline" sx={{ color: "inherit" }}>
                Open in Plan Editor
              </Typography>
              <ArrowForwardIcon sx={{ fontSize: (theme) => theme.typography.pxToRem(14) }} />
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
};
