import { Stack, Typography } from "@mui/material";

import type { AthleteConsistency } from "@repo/contracts/coaching/coach-athletes";
import { rateToPercent } from "@repo/shared";

import { ConsistencySectionStatItem } from "./consistency-section-stat-item";

type ConsistencySectionProps = {
  consistency: AthleteConsistency;
};

export const ConsistencySection: React.FC<ConsistencySectionProps> = ({ consistency }) => (
  <Stack spacing={1} sx={{ p: 2.5 }}>
    <Typography variant="subtitle2">Consistency</Typography>
    <Stack direction="row" spacing={2}>
      <ConsistencySectionStatItem
        label="4-week adherence"
        value={`${rateToPercent(consistency.adherenceRate4w)}%`}
      />
      <ConsistencySectionStatItem label="Current streak" value={`${consistency.currentStreak}`} />
      <ConsistencySectionStatItem
        label="Missed this week"
        value={`${consistency.missedThisWeek}`}
      />
    </Stack>
  </Stack>
);
