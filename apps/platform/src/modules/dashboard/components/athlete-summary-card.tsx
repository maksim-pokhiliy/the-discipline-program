"use client";

import { FlagRounded } from "@mui/icons-material";
import { Avatar, Badge, Box, Stack, Typography } from "@mui/material";
import Link from "next/link";

import type { AthleteDailySummary } from "@repo/contracts/coach-dashboard";

import { AthleteStatusChip } from "./athlete-status-chip";

type AthleteSummaryCardProps = {
  athlete: AthleteDailySummary;
};

const formatLastActivity = (daysSince: number | null): string => {
  if (daysSince === null) {
    return "No activity";
  }

  if (daysSince === 0) {
    return "Today";
  }

  if (daysSince === 1) {
    return "Yesterday";
  }

  return `${daysSince}d ago`;
};

export const AthleteSummaryCard = ({ athlete }: AthleteSummaryCardProps) => {
  const displayName = athlete.name ?? athlete.email;
  const initials = athlete.name
    ? athlete.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (athlete.email[0]?.toUpperCase() ?? "?");

  return (
    <Box
      component={Link}
      href={`/coach/athletes/${athlete.userId}`}
      sx={{
        textDecoration: "none",
        color: "inherit",
        "&:active": { opacity: 0.7 },
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: "center",
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Badge
          badgeContent={athlete.activeFlags.length > 0 ? athlete.activeFlags.length : undefined}
          color="error"
          overlap="circular"
          sx={{
            "& .MuiBadge-badge": { fontSize: "0.6rem", minWidth: 16, height: 16 },
          }}
        >
          <Avatar
            src={athlete.image ?? undefined}
            sx={{ width: 40, height: 40, bgcolor: "primary.dark", fontSize: "0.85rem" }}
          >
            {initials}
          </Avatar>
        </Badge>
        <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {displayName}
            </Typography>
            {athlete.activeFlags.some((f) => f.type === "INJURY") && (
              <FlagRounded sx={{ fontSize: 14, color: "error.main" }} />
            )}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
              {athlete.planName ?? "No plan"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.65rem" }}>
              {formatLastActivity(athlete.daysSinceLastActivity)}
            </Typography>
          </Stack>
        </Stack>
        <AthleteStatusChip status={athlete.todayStatus} />
      </Stack>
    </Box>
  );
};
