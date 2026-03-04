"use client";

import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { type Palette, type PaletteColor } from "@mui/material/styles";

type PaletteColorKey = {
  [K in keyof Palette]: Palette[K] extends PaletteColor ? K : never;
}[keyof Palette];

export type PulseStatProps = {
  value: string | number;
  label: string;
  tooltip: string;
  color: PaletteColorKey;
  icon: React.ReactNode;
};

export const PulseStat: React.FC<PulseStatProps> = ({ value, label, tooltip, color, icon }) => (
  <Tooltip title={tooltip} arrow placement="top">
    <Stack spacing={1} sx={{ alignItems: "center", py: 1.5, cursor: "help" }}>
      <Box sx={(theme) => ({ color: theme.palette[color].main })}>{icon}</Box>

      <Typography
        variant="h6"
        sx={(theme) => ({
          fontWeight: 700,
          color: theme.palette[color].main,
          lineHeight: 1,
        })}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </Typography>

      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
    </Stack>
  </Tooltip>
);
