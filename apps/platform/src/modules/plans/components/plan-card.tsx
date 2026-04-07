"use client";

import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import GroupIcon from "@mui/icons-material/Group";
import { Box, Paper, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import type { TrainingPlanListItem } from "@repo/contracts/training-plan";
import { formatDate } from "@repo/shared";

import { PlanActionMenu } from "./plan-action-menu";
import { PlanStatusChip } from "./plan-status-chip";

type PlanCardProps = {
  plan: TrainingPlanListItem;
  onActivate: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
};

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onActivate,
  onArchive,
  onRestore,
  onDuplicate,
  onDelete,
  isPending,
}) => (
  <Paper
    variant="outlined"
    sx={(theme) => ({
      position: "relative",
      transition: theme.transitions.create("border-color"),
      "&:hover": { borderColor: theme.palette.primary.main },
    })}
  >
    <Box
      component={Link}
      href={`/coach/plans/${plan.id}`}
      sx={(theme) => ({
        textDecoration: "none",
        color: "inherit",
        p: 2,
        pr: 6,
        borderRadius: 1,
        transition: theme.transitions.create("opacity"),
        "&:hover": { opacity: 0.85 },
      })}
    >
      <Stack spacing={1.5}>
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="subtitle1" noWrap>
              {plan.name}
            </Typography>
            <PlanStatusChip status={plan.status} />
          </Stack>

          {plan.description && (
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {plan.description}
            </Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={2} sx={{ color: "text.secondary" }}>
          <Tooltip title="Active enrolled athletes" arrow placement="top">
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <GroupIcon fontSize="small" />
              <Typography variant="caption">
                {plan.enrolledAthletesCount}{" "}
                {plan.enrolledAthletesCount === 1 ? "athlete" : "athletes"}
              </Typography>
            </Stack>
          </Tooltip>

          <Tooltip title="Scheduled workouts" arrow placement="top">
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <FitnessCenterIcon fontSize="small" />
              <Typography variant="caption">
                {plan.workoutsToday} today · {plan.workoutsThisWeek} this week
              </Typography>
            </Stack>
          </Tooltip>

          <Tooltip title="Plan created" arrow placement="top">
            <Typography variant="caption" sx={{ ml: "auto" }}>
              {formatDate(plan.createdAt, "short")}
            </Typography>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>

    <Box sx={(theme) => ({ position: "absolute", top: theme.spacing(1), right: theme.spacing(1) })}>
      <PlanActionMenu
        planId={plan.id}
        planName={plan.name}
        status={plan.status}
        onActivate={() => onActivate(plan.id)}
        onArchive={() => onArchive(plan.id)}
        onRestore={() => onRestore(plan.id)}
        onDuplicate={() => onDuplicate(plan.id)}
        onDelete={() => onDelete(plan.id)}
        isPending={isPending}
      />
    </Box>
  </Paper>
);
