"use client";

import type { ReactNode } from "react";

import { Stack, type StackProps, Typography } from "@mui/material";

type SectionHeaderProps = StackProps & {
  title: string;
  action?: ReactNode;
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action, ...props }) => {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" {...props}>
      <Typography variant="h6">{title}</Typography>
      {action}
    </Stack>
  );
};
