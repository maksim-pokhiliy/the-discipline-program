"use client";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { alpha, Stack, Typography } from "@mui/material";

import type { SessionWithLabel } from "@repo/contracts/lms/day";

import { computeDayStats } from "../lib/compute-day-stats";
import { computeDaySummary } from "../lib/compute-day-summary";

const SURFACE_ALPHA = 0.02;
const SUMMARY_PLACEHOLDER = "—";

type DayRowSummaryProps = {
  sessions: SessionWithLabel[];
  onClick: () => void;
};

export const DayRowSummary: React.FC<DayRowSummaryProps> = ({ sessions, onClick }) => {
  const stats = computeDayStats(sessions);
  const summary = computeDaySummary(sessions);
  const summaryText = summary === "" ? SUMMARY_PLACEHOLDER : summary;

  return (
    <Stack
      direction="row"
      spacing={1.75}
      alignItems="center"
      onClick={onClick}
      sx={(theme) => ({
        cursor: "pointer",
        borderRadius: 0.5,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.common.white, SURFACE_ALPHA),
        px: 1.75,
        py: 1.25,
        transition: "background-color 150ms, border-color 150ms",
        "&:hover": {
          bgcolor: theme.palette.action.hover,
          borderColor: theme.palette.dividerStrong,
        },
      })}
    >
      <ChevronRightIcon fontSize="small" sx={{ color: "text.disabled" }} />
      <Typography
        variant="body2"
        color="text.primary"
        noWrap
        sx={{ flex: 1, minWidth: 0, fontWeight: 600 }}
      >
        {summaryText}
      </Typography>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {stats.blocks} blocks
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {stats.schemas} schemas
        </Typography>
        {stats.estMinutes > 0 ? (
          <Typography variant="caption" color="text.secondary">
            ~{stats.estMinutes} min
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
};
