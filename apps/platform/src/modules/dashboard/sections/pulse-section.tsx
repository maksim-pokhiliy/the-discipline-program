"use client";

import type { DashboardOverview } from "@repo/contracts/coach-dashboard";

import { type PulseStatProps, PulseStatsCard } from "@app/lib/components";

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

  return <PulseStatsCard stats={stats} />;
};
