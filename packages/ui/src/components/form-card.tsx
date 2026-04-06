"use client";

import { type ReactNode } from "react";

import { Card, CardContent, CardHeader, type CardProps } from "@mui/material";

export interface FormCardProps extends Omit<CardProps, "content"> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export const FormCard = ({ title, subtitle, action, children, ...props }: FormCardProps) => {
  return (
    <Card {...props}>
      <CardHeader title={title} subheader={subtitle} action={action} />

      <CardContent>{children}</CardContent>
    </Card>
  );
};
