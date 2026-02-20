"use client";

import { ErrorRounded, FlagRounded, InfoRounded, WarningRounded } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import Link from "next/link";

import type { AttentionAlert } from "@repo/contracts/coach-dashboard";
import { type ALERT_SEVERITIES } from "@repo/contracts/coach-dashboard";

type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

const SEVERITY_CONFIG: Record<AlertSeverity, { icon: React.ReactNode; color: string }> = {
  CRITICAL: { icon: <ErrorRounded fontSize="small" />, color: "error.main" },
  WARNING: { icon: <WarningRounded fontSize="small" />, color: "warning.main" },
  INFO: { icon: <InfoRounded fontSize="small" />, color: "info.main" },
};

type AttentionAlertItemProps = {
  alert: AttentionAlert;
};

export const AttentionAlertItem = ({ alert }: AttentionAlertItemProps) => {
  const config = SEVERITY_CONFIG[alert.severity];

  return (
    <Box
      component={Link}
      href={alert.href}
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
          alignItems: "flex-start",
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Stack sx={{ color: config.color, mt: 0.25 }}>
          {alert.type === "OPEN_FLAG" ? (
            <FlagRounded fontSize="small" sx={{ color: config.color }} />
          ) : (
            config.icon
          )}
        </Stack>
        <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {alert.athleteName ?? "Unknown"}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.3 }}>
            {alert.message}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
};
