"use client";

import { FlagRounded, GroupRounded, ScheduleRounded, TimerOffRounded } from "@mui/icons-material";
import { Grid } from "@mui/material";

import type { DashboardOverview } from "@repo/contracts/coach-dashboard";

import { StatCard } from "../components";

type OverviewSectionProps = {
  overview: DashboardOverview;
};

export const OverviewSection = ({ overview }: OverviewSectionProps) => {
  const completionRate =
    overview.workoutsPlannedToday > 0
      ? Math.round((overview.workoutsCompletedToday / overview.workoutsPlannedToday) * 100)
      : 0;

  return (
    <Grid container spacing={1.5}>
      <Grid size={6}>
        <StatCard
          label="Active Athletes"
          value={overview.totalActiveAthletes}
          icon={<GroupRounded />}
          color="info"
        />
      </Grid>
      <Grid size={6}>
        <StatCard
          label="Completed Today"
          value={`${overview.workoutsCompletedToday}/${overview.workoutsPlannedToday}`}
          icon={<ScheduleRounded />}
          color="success"
          subtitle={`${completionRate}%`}
        />
      </Grid>
      <Grid size={6}>
        <StatCard
          label="Open Flags"
          value={overview.openFlagsCount}
          icon={<FlagRounded />}
          color={overview.openFlagsCount > 0 ? "error" : "success"}
        />
      </Grid>
      <Grid size={6}>
        <StatCard
          label="Plans Ending"
          value={overview.endingPlansCount}
          icon={<TimerOffRounded />}
          color={overview.endingPlansCount > 0 ? "warning" : "info"}
        />
      </Grid>
    </Grid>
  );
};
