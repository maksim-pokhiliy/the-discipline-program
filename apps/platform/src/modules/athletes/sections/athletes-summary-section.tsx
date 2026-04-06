"use client";

import { Card, CardContent, Grid } from "@mui/material";

import type { CoachAthletesSummary } from "@repo/contracts/coach-athletes";

import { PulseStat, type PulseStatProps } from "@app/lib/components";

type AthletesSummarySectionProps = {
  summary: CoachAthletesSummary;
};

export const AthletesSummarySection: React.FC<AthletesSummarySectionProps> = ({ summary }) => {
  const stats: PulseStatProps[] = [
    {
      value: summary.total,
      label: "Total",
      tooltip: "Total athletes enrolled in your plans",
      color: "primary",
    },
    {
      value: summary.active,
      label: "Active",
      tooltip: "Athletes with active enrollment",
      color: "success",
    },
    {
      value: summary.needsAttention,
      label: "Attention",
      tooltip: "Athletes with open action items",
      color: summary.needsAttention > 0 ? "warning" : "success",
    },
    {
      value: summary.injured + summary.restricted,
      label: "Health",
      tooltip: "Injured or restricted athletes",
      color: summary.injured + summary.restricted > 0 ? "error" : "success",
    },
  ];

  return (
    <Card>
      <CardContent>
        <Grid container>
          {stats.map((stat) => (
            <Grid key={stat.label} size={{ xs: 6, sm: 3 }}>
              <PulseStat {...stat} />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};
