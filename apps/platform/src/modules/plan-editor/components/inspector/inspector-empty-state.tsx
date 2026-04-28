"use client";

import { Typography } from "@mui/material";

type InspectorEmptyStateProps = {
  message: string;
};

export const InspectorEmptyState = ({ message }: InspectorEmptyStateProps) => (
  <Typography variant="body2" color="text.secondary">
    {message}
  </Typography>
);
