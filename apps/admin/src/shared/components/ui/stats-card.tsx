"use client";

import { Card, CardContent, Typography, Stack, Box } from "@mui/material";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
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
  icon,
  color = "primary",
  trend,
}: StatsCardProps) => {
  return (
    <Card sx={{ height: "100%" }} variant="outlined">
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
              <Box
                sx={(theme) => ({
                  color: theme.palette[color].main,
                  display: "flex",
                  alignItems: "center",
                })}
              >
                {icon}
              </Box>
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
};
