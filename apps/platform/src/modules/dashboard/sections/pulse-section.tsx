"use client";

import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import GroupIcon from "@mui/icons-material/Group";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Grid, Paper } from "@mui/material";

import type { DashboardOverview } from "@repo/contracts/coach-dashboard";

import { PulseStat, type PulseStatProps } from "../components/pulse-stat";

type PulseSectionProps = {
  overview: DashboardOverview;
};

export const PulseSection: React.FC<PulseSectionProps> = ({ overview }) => {
  const stats: PulseStatProps[] = [
    {
      value: overview.totalActiveAthletes,
      label: "Athletes",
      tooltip: "Total athletes with active enrollment",
      color: "success",
      icon: <GroupIcon fontSize="small" />,
    },
    {
      value:
        overview.workoutsPlannedToday > 0
          ? `${overview.workoutsCompletedToday}/${overview.workoutsPlannedToday}`
          : "—",
      label: "Today",
      tooltip: "Completed / planned workouts for today",
      color: "primary",
      icon: <FitnessCenterIcon fontSize="small" />,
    },
    {
      value:
        overview.workoutsPlannedThisWeek > 0
          ? `${overview.workoutsCompletedThisWeek}/${overview.workoutsPlannedThisWeek}`
          : "—",
      label: "This Week",
      tooltip: "Completed / planned workouts for this week",
      color: overview.workoutsPlannedThisWeek > 0 ? "primary" : "warning",
      icon: <DirectionsRunIcon fontSize="small" />,
    },
    {
      value: overview.openActionItemsCount,
      label: "Attention",
      tooltip: "Open action items requiring your review",
      color: overview.openActionItemsCount > 0 ? "warning" : "success",
      icon: <WarningAmberIcon fontSize="small" />,
    },
    {
      value: overview.activePlansCount,
      label: "Plans",
      tooltip: "Training plans with active status",
      color: "primary",
      icon: <ListAltIcon fontSize="small" />,
    },
    {
      value: overview.newAthletesCount,
      label: "New",
      tooltip: "Athletes enrolled this calendar week",
      color: overview.newAthletesCount > 0 ? "info" : "primary",
      icon: <PersonAddIcon fontSize="small" />,
    },
  ];

  return (
    <Paper variant="outlined" sx={{ px: 1, py: 0.5 }}>
      <Grid container>
        {stats.map((stat) => (
          <Grid key={stat.label} size={{ xs: 4, sm: 2 }}>
            <PulseStat {...stat} />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};
