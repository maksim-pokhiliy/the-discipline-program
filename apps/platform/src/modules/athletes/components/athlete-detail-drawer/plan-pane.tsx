"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Chip, LinearProgress, Stack, Typography } from "@mui/material";
import Link from "next/link";

import type {
  CoachAthleteEnrollment,
  PlanDiscipline,
} from "@repo/contracts/coaching/coach-athletes";
import { EnrollmentStatus } from "@repo/contracts/lms";
import { rateToPercent } from "@repo/shared";

import { formatRelativeTime } from "../athletes-roster-config";

const NO_PLAN_LABEL = "No active plan enrollment.";
const PROGRESS_BAR_HEIGHT = 0.75;

type PlanPaneProps = {
  enrollments: CoachAthleteEnrollment[];
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

export const PlanPane: React.FC<PlanPaneProps> = ({
  enrollments,
  planDiscipline,
  currentWeek,
  totalWeeks,
}) => {
  if (enrollments.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.muted", fontStyle: "italic" }}>
        {NO_PLAN_LABEL}
      </Typography>
    );
  }

  const disciplineByPlan = new Map(planDiscipline.map((plan) => [plan.planId, plan]));
  const isSinglePlan = enrollments.length === 1;
  const weekLabel = isSinglePlan ? formatWeek(currentWeek, totalWeeks) : null;

  return (
    <Stack spacing={2}>
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        Active plans
      </Typography>

      {enrollments.map((enrollment) => {
        const paused = enrollment.status === EnrollmentStatus.PAUSED;
        const discipline = disciplineByPlan.get(enrollment.planId);
        const progress =
          discipline && discipline.planned > 0
            ? rateToPercent(discipline.completed / discipline.planned)
            : 0;

        return (
          <Stack
            key={enrollment.planId}
            component={Link}
            href={`/coach/plans/${enrollment.planId}`}
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
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h5" noWrap sx={{ flex: 1, minWidth: 0, color: "text.primary" }}>
                {enrollment.planName}
              </Typography>
              <Chip
                size="small"
                label={paused ? "Paused" : "Active"}
                color={paused ? "warning" : "success"}
              />
            </Stack>

            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Boarded {formatRelativeTime(enrollment.boardedAt)}
            </Typography>

            {weekLabel !== null && (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
              >
                {weekLabel}
              </Typography>
            )}

            {discipline && (
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
                  {discipline.completed}/{discipline.planned}
                </Typography>
              </Stack>
            )}

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
