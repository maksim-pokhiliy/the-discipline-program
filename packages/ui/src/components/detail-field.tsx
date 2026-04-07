"use client";

import { type ReactNode } from "react";

import { Stack, Typography, type StackProps, useTheme } from "@mui/material";

export interface DetailFieldProps extends Omit<StackProps, "children"> {
  label: string;
  value?: ReactNode;
  labelWidth?: number | string;
  children?: ReactNode;
}

export const DetailField = ({ label, value, labelWidth, children, ...props }: DetailFieldProps) => {
  const theme = useTheme();
  const resolvedLabelWidth = labelWidth ?? theme.spacing(15);

  return (
    <Stack direction="row" spacing={1} alignItems="center" {...props}>
      <Typography variant="subtitle2" sx={{ minWidth: resolvedLabelWidth }}>
        {label}:
      </Typography>
      {children || (
        <Typography variant="body2" color="text.secondary">
          {value}
        </Typography>
      )}
    </Stack>
  );
};
