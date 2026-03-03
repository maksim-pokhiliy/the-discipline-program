"use client";

import { type ReactNode } from "react";

import { Card, CardContent, Typography, Stack, Tooltip } from "@mui/material";
import { type Palette, type PaletteColor } from "@mui/material/styles";

type PaletteColorKey = {
  [K in keyof Palette]: Palette[K] extends PaletteColor ? K : never;
}[keyof Palette];

const sizeConfig = {
  small: { titleVariant: "body2", valueVariant: "h5", spacing: 3, iconSize: "medium" },
  medium: { titleVariant: "h6", valueVariant: "h3", spacing: 4, iconSize: "large" },
} as const;

type StatsCardProps = {
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
          sx={{
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant={config.titleVariant} sx={{ color: "text.secondary" }}>
              {title}
            </Typography>

            {icon && (
              <Stack
                sx={(theme) => ({
                  color: theme.palette[color].main,
                  alignItems: "center",
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
                fontWeight: 700,
                color: theme.palette[color].main,
              })}
            >
              {typeof value === "number" ? value.toLocaleString() : value}
            </Typography>

            <Stack spacing={1}>
              {subtitle && (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {subtitle}
                </Typography>
              )}

              {trend && (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: trend.isPositive ? "success.main" : "error.main",
                      fontWeight: 600,
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
