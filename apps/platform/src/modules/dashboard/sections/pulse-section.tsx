"use client";

import { Card, CardContent, Grid } from "@mui/material";

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
    },
    {
      value: `${overview.workoutsCompletedToday}/${overview.workoutsPlannedToday}`,
      label: "Today",
      tooltip: "Completed / planned workouts for today",
      color: "primary",
    },
    {
      value: `${overview.workoutsCompletedThisWeek}/${overview.workoutsPlannedThisWeek}`,
      label: "This Week",
      tooltip: "Completed / planned workouts for this week",
      color: "primary",
    },
    {
      value: overview.openActionItemsCount,
      label: "Attention",
      tooltip: "Open action items requiring your review",
      color: overview.openActionItemsCount > 0 ? "warning" : "success",
    },
    {
      value: overview.activePlansCount,
      label: "Plans",
      tooltip: "Training plans with active status",
      color: "primary",
    },
    {
      value: overview.newAthletesCount,
      label: "New",
      tooltip: "Athletes enrolled this calendar week",
      color: overview.newAthletesCount > 0 ? "info" : "primary",
    },
  ];

  return (
    <Card>
      <CardContent>
        <Grid container>
          {stats.map((stat) => (
            <Grid key={stat.label} size={{ xs: 4, sm: 2 }}>
              <PulseStat {...stat} />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};
