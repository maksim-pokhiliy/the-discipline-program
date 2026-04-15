"use client";

import { type ReactNode } from "react";

import { Card, CardContent, Typography, Stack, Tooltip } from "@mui/material";

import { type PaletteColorKey } from "@repo/mui";

const sizeConfig = {
  small: { titleVariant: "body2", valueVariant: "h5", spacing: 3 },
  medium: { titleVariant: "h3", valueVariant: "display2", spacing: 4 },
} as const;

export type StatsCardProps = {
  title: string;
  value: string | number;
  size?: "small" | "medium";
  subtitle?: string;
  tooltip?: string;
  icon?: ReactNode;
  color?: PaletteColorKey;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
};

export const StatsCard = ({
  title,
  value,
  size = "medium",
  subtitle,
  tooltip,
  icon,
  color = "primary",
  trend,
}: StatsCardProps) => {
  const config = sizeConfig[size];

  const card = (
    <Card sx={{ height: "100%" }} variant="outlined">
      <CardContent>
        <Stack
          spacing={config.spacing}
          justifyContent="space-between"
          sx={{
            height: "100%",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant={config.titleVariant} sx={{ color: "text.secondary" }}>
              {title}
            </Typography>

            {icon && (
              <Stack
                alignItems="center"
                sx={(theme) => ({
                  color: theme.palette[color].main,
                })}
              >
                {icon}
              </Stack>
            )}
          </Stack>

          <Stack>
            <Typography
              variant={config.valueVariant}
              sx={(theme) => ({
                color: theme.palette[color].main,
              })}
            >
              {typeof value === "number" ? value.toLocaleString() : value}
            </Typography>

            <Stack spacing={1}>
              {subtitle && (
                <Typography variant="h5" sx={{ color: "text.secondary" }}>
                  {subtitle}
                </Typography>
              )}

              {trend && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    variant="caption"
                    sx={{
                      color: trend.isPositive ? "success.main" : "error.main",
                    }}
                  >
                    {trend.isPositive ? "+" : ""}
                    {trend.value}%
                  </Typography>

                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {trend.label}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );

  if (!tooltip) {
    return card;
  }

  return (
    <Tooltip title={tooltip} arrow placement="top">
      {card}
    </Tooltip>
  );
};
