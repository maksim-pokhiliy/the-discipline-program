"use client";

import { type ReactNode } from "react";

import { Card, CardContent, CardHeader, Stack, type CardProps } from "@mui/material";

export type FormCardProps = Omit<CardProps, "content"> & {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

export const FormCard = ({ title, subtitle, action, children, ...props }: FormCardProps) => {
  return (
    <Card {...props}>
      <CardHeader title={title} subheader={subtitle} action={action} />

      <CardContent>
        <Stack spacing={4}>{children}</Stack>
      </CardContent>
    </Card>
  );
};
