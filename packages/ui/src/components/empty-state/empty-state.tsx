"use client";

import { type ReactNode } from "react";

import { Button, Stack, Typography } from "@mui/material";

export type EmptyStateAction = {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
};

export type EmptyStateProps = {
  message: string;
  action?: EmptyStateAction;
};

export const EmptyState: React.FC<EmptyStateProps> = ({ message, action }) => (
  <Stack spacing={2} alignItems="center" sx={{ py: 4, textAlign: "center" }}>
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      {message}
    </Typography>
    {action ? (
      <Button startIcon={action.icon} onClick={action.onClick} disabled={action.disabled}>
        {action.label}
      </Button>
    ) : null}
  </Stack>
);
