"use client";

import { type ReactNode } from "react";

import { Card, CardContent, Typography, Stack, Tooltip } from "@mui/material";
import { type Palette, type PaletteColor } from "@mui/material/styles";

type PaletteColorKey = {
  [K in keyof Palette]: Palette[K] extends PaletteColor ? K : never;
}[keyof Palette];

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  tooltip?: string;
  icon?: ReactNode;
  color?: PaletteColorKey;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
}

export const StatsCard = ({
  title,
  value,
  subtitle,
  tooltip,
  icon,
  color = "primary",
  trend,
}: StatsCardProps) => {
  const card = (
    <Card
      sx={{
        height: "100%",
      }}
      variant="outlined"
    >
      <CardContent>
        <Stack
          spacing={4}
          sx={{
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ color: "text.secondary" }}>
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
              variant="h3"
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
