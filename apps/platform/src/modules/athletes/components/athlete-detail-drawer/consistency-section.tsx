"use client";

import { Stack, Typography } from "@mui/material";

import type { AthleteConsistency } from "@repo/contracts/coach-athletes";
import { rateToPercent } from "@repo/shared";

type ConsistencySectionProps = {
  consistency: AthleteConsistency;
};

type StatItemProps = {
  label: string;
  value: string;
};

const StatItem: React.FC<StatItemProps> = ({ label, value }) => (
  <Stack sx={{ flex: 1, minWidth: 0 }}>
    <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
      {value}
    </Typography>
    <Typography variant="caption" sx={{ color: "text.secondary" }}>
      {label}
    </Typography>
  </Stack>
);

export const ConsistencySection: React.FC<ConsistencySectionProps> = ({ consistency }) => (
  <Stack spacing={1} sx={{ p: 2.5 }}>
    <Typography variant="subtitle2">Consistency</Typography>
    <Stack direction="row" spacing={2}>
      <StatItem label="4-week adherence" value={`${rateToPercent(consistency.adherenceRate4w)}%`} />
      <StatItem label="Current streak" value={`${consistency.currentStreak}`} />
      <StatItem label="Missed this week" value={`${consistency.missedThisWeek}`} />
    </Stack>
  </Stack>
);
