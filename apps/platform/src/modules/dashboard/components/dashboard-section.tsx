"use client";

import { Chip, type ChipProps, Divider, Paper, Stack, Typography } from "@mui/material";

type DashboardSectionProps = {
  title: string;
  badge?: { label: string | number; color: ChipProps["color"] };
  children: React.ReactNode;
};

export const DashboardSection: React.FC<DashboardSectionProps> = ({ title, badge, children }) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Typography variant="h6">{title}</Typography>
        {badge && <Chip size="small" label={badge.label} color={badge.color} />}
      </Stack>

      <Divider />

      {children}
    </Stack>
  </Paper>
);
