"use client";

import { TrendingDownRounded, TrendingFlatRounded, TrendingUpRounded } from "@mui/icons-material";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import Link from "next/link";

import type { ProgressAthlete } from "@repo/contracts/coach-dashboard";
import { type PROGRESS_TRENDS } from "@repo/contracts/coach-dashboard";

type ProgressTrend = (typeof PROGRESS_TRENDS)[number];

const TREND_CONFIG: Record<ProgressTrend, { icon: React.ReactNode; color: string }> = {
  UP: { icon: <TrendingUpRounded fontSize="small" />, color: "success.main" },
  STABLE: { icon: <TrendingFlatRounded fontSize="small" />, color: "text.secondary" },
  DOWN: { icon: <TrendingDownRounded fontSize="small" />, color: "error.main" },
};

type ProgressAthleteRowProps = {
  athlete: ProgressAthlete;
};

export const ProgressAthleteRow = ({ athlete }: ProgressAthleteRowProps) => {
  const config = TREND_CONFIG[athlete.trend];
  const initials = athlete.name
    ? athlete.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <Box
      component={Link}
      href={athlete.href}
      sx={{
        textDecoration: "none",
        color: "inherit",
        "&:active": { opacity: 0.7 },
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", py: 1, borderBottom: 1, borderColor: "divider" }}
      >
        <Avatar
          src={athlete.image ?? undefined}
          sx={{ width: 32, height: 32, bgcolor: "primary.dark", fontSize: "0.75rem" }}
        >
          {initials}
        </Avatar>
        <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }} noWrap>
          {athlete.name ?? "Unknown"}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
          {Math.round(athlete.completionRate * 100)}%
        </Typography>
        <Stack sx={{ color: config.color }}>{config.icon}</Stack>
      </Stack>
    </Box>
  );
};
