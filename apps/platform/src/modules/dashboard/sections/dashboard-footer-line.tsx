"use client";

import { Box, Stack, type SxProps, type Theme, Typography } from "@mui/material";

import type { DashboardOverview } from "@repo/contracts/coaching/coach-dashboard";
import { rateToPercent } from "@repo/shared";

const DOT = "·";
const STRONG_SX: SxProps<Theme> = { color: "text.primary", fontWeight: 600 };

type DashboardFooterLineProps = {
  overview: DashboardOverview;
  avgEngagementRate: number;
};

export const DashboardFooterLine: React.FC<DashboardFooterLineProps> = ({
  overview,
  avgEngagementRate,
}) => (
  <Typography
    component="div"
    variant="caption"
    sx={{ color: "text.secondary", textAlign: "center", py: 1 }}
  >
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      justifyContent="center"
      flexWrap="wrap"
      useFlexGap
    >
      <Box component="span">This week</Box>
      <Box component="span">{DOT}</Box>
      <Box component="span">
        <Box component="span" sx={STRONG_SX}>
          {overview.workoutsCompletedThisWeek}
        </Box>
        /{overview.workoutsPlannedThisWeek} sessions
      </Box>
      <Box component="span">{DOT}</Box>
      <Box component="span">
        <Box component="span" sx={STRONG_SX}>
          {rateToPercent(avgEngagementRate)}%
        </Box>{" "}
        engagement
      </Box>
      <Box component="span">{DOT}</Box>
      <Box component="span">
        <Box component="span" sx={STRONG_SX}>
          {overview.newAthletesCount}
        </Box>{" "}
        new athletes
      </Box>
    </Stack>
  </Typography>
);
