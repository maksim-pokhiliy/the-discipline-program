import { Stack, Typography } from "@mui/material";

import type { AthleteConsistency } from "@repo/contracts/coaching/coach-athletes";
import { rateToPercent } from "@repo/shared";

type ConsistencySectionProps = {
  consistency: AthleteConsistency;
};

type ConsistencySectionStatItemProps = {
  label: string;
  value: string;
};

const ConsistencySectionStatItem: React.FC<ConsistencySectionStatItemProps> = ({
  label,
  value,
}) => (
  <Stack sx={{ flex: 1, minWidth: 0 }}>
    <Typography variant="h6">{value}</Typography>
    <Typography variant="caption" sx={{ color: "text.secondary" }}>
      {label}
    </Typography>
  </Stack>
);

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
