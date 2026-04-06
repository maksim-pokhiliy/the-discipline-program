"use client";

import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Box, Stack, Typography } from "@mui/material";

import { ActionItemSeverity } from "@repo/contracts/coach-action-item";
import type { AthleteActionItem } from "@repo/contracts/coach-athletes";

import { SEVERITY_COLORS, formatShortDate } from "./config";

type AttentionSectionProps = {
  actionItems: AthleteActionItem[];
};

const SEVERITY_ICONS: Record<ActionItemSeverity, React.ReactElement> = {
  [ActionItemSeverity.CRITICAL]: <ErrorOutlineIcon fontSize="small" />,
  [ActionItemSeverity.WARNING]: <WarningAmberIcon fontSize="small" />,
  [ActionItemSeverity.INFO]: <InfoOutlinedIcon fontSize="small" />,
};

export const AttentionSection: React.FC<AttentionSectionProps> = ({ actionItems }) => {
  if (actionItems.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1} sx={{ p: 2.5 }}>
      <Typography variant="subtitle2">Attention</Typography>
      {actionItems.map((item) => (
        <Stack key={item.id} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
          <Box sx={{ color: SEVERITY_COLORS[item.severity], mt: 0.25 }}>
            {SEVERITY_ICONS[item.severity]}
          </Box>
          <Stack sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2">{item.message}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {formatShortDate(item.createdAt)}
            </Typography>
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
};
