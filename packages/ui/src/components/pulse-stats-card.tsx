"use client";

import { Card, CardContent, Grid, type GridSize } from "@mui/material";

import { PulseStat, type PulseStatProps } from "./pulse-stat";

export type PulseStatsCardProps = {
  stats: PulseStatProps[];
  columns?: { xs: GridSize; sm: GridSize };
};

export const PulseStatsCard: React.FC<PulseStatsCardProps> = ({
  stats,
  columns = { xs: 4, sm: 2 },
}) => (
  <Card>
    <CardContent>
      <Grid container>
        {stats.map((stat) => (
          <Grid key={stat.label} size={columns}>
            <PulseStat {...stat} />
          </Grid>
        ))}
      </Grid>
    </CardContent>
  </Card>
);
