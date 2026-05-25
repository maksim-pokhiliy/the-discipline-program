"use client";

import { Typography } from "@mui/material";

type SessionCardCollapsedStatsProps = {
  blockCount: number;
};

export const SessionCardCollapsedStats: React.FC<SessionCardCollapsedStatsProps> = ({
  blockCount,
}) => (
  <Typography variant="caption" color="text.subtle" sx={{ ml: "auto" }}>
    {blockCount} block{blockCount === 1 ? "" : "s"}
  </Typography>
);
