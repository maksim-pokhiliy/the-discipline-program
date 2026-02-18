"use client";

import { type ReactNode } from "react";

import { Stack, Typography, type StackProps } from "@mui/material";

export interface DetailFieldProps extends Omit<StackProps, "children"> {
  label: string;
  value?: ReactNode;
  labelWidth?: number;
  children?: ReactNode;
}

export const DetailField = ({
  label,
  value,
  labelWidth = 120,
  children,
  ...props
}: DetailFieldProps) => (
  <Stack direction="row" spacing={1} alignItems="center" {...props}>
    <Typography variant="subtitle2" sx={{ minWidth: labelWidth }}>
      {label}:
    </Typography>
    {children || (
      <Typography variant="body2" color="text.secondary">
        {value}
      </Typography>
    )}
  </Stack>
);
