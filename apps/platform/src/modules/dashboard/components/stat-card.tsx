"use client";

import { type ReactNode } from "react";

import { Card, CardContent, Stack, Typography } from "@mui/material";
import { type Palette, type PaletteColor } from "@mui/material/styles";

type PaletteColorKey = {
  [K in keyof Palette]: Palette[K] extends PaletteColor ? K : never;
}[keyof Palette];

type StatCardProps = {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: PaletteColorKey;
  subtitle?: string;
};

export const StatCard = ({ label, value, icon, color = "primary", subtitle }: StatCardProps) => {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack spacing={1}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Stack
              sx={(theme) => ({
                color: theme.palette[color].main,
                opacity: 0.8,
              })}
            >
              {icon}
            </Stack>
          </Stack>
          <Stack spacing={0.25}>
            <Typography
              variant="h5"
              sx={(theme) => ({
                fontWeight: 700,
                color: theme.palette[color].main,
                lineHeight: 1.2,
              })}
            >
              {typeof value === "number" ? value.toLocaleString() : value}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.3 }}>
              {label}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                sx={{ color: "text.disabled", fontSize: "0.65rem", lineHeight: 1.2 }}
              >
                {subtitle}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
