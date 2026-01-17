"use client";

import { type ReactNode } from "react";

import { Card, CardContent, CardHeader, Divider, type CardProps } from "@mui/material";

export interface FormCardProps extends Omit<CardProps, "content"> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  noDivider?: boolean;
}

export const FormCard = ({
  title,
  subtitle,
  action,
  children,
  noDivider = false,
  ...props
}: FormCardProps) => {
  return (
    <Card variant="outlined" {...props}>
      <CardHeader
        title={title}
        subheader={subtitle}
        action={action}
        slotProps={{
          title: { variant: "h6", fontWeight: "bold" },
          subheader: { variant: "subtitle2", color: "text.secondary" },
        }}
      ></CardHeader>

      <CardContent>
        {!noDivider && <Divider sx={{ mb: 4 }} />}

        {children}
      </CardContent>
    </Card>
  );
};
