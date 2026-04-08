"use client";

import { Stack, Tooltip, Typography } from "@mui/material";

import { type PaletteColorKey } from "@repo/mui";

export type PulseStatProps = {
  value: string | number;
  label: string;
  tooltip: string;
  color: PaletteColorKey;
};

export const PulseStat: React.FC<PulseStatProps> = ({ value, label, tooltip, color }) => (
  <Tooltip title={tooltip} arrow placement="top">
    <Stack spacing={1} sx={{ alignItems: "center" }}>
      <Typography
        variant="h4"
        sx={(theme) => ({
          color: theme.palette[color].main,
        })}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </Typography>

      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
    </Stack>
  </Tooltip>
);
