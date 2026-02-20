"use client";

import { Box, Stack, Typography } from "@mui/material";
import Link from "next/link";

import type { DashboardNote } from "@repo/contracts/coach-dashboard";

type CoachNoteItemProps = {
  note: DashboardNote;
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return "just now";
  }

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  const diffHours = Math.floor(diffMins / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Date(date).toLocaleDateString();
};

export const CoachNoteItem = ({ note }: CoachNoteItemProps) => {
  return (
    <Box
      component={Link}
      href={`/coach/athletes/${note.athleteId}`}
      sx={{
        textDecoration: "none",
        color: "inherit",
        "&:active": { opacity: 0.7 },
      }}
    >
      <Stack spacing={0.5} sx={{ py: 1.5, borderBottom: 1, borderColor: "divider" }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {note.athleteName ?? "Unknown"}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {formatRelativeTime(note.createdAt)}
          </Typography>
        </Stack>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {note.content}
        </Typography>
      </Stack>
    </Box>
  );
};
