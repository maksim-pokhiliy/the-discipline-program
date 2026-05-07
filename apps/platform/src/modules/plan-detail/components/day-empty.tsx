"use client";

import { Typography } from "@mui/material";

type DayEmptyProps = { hasDayType: boolean };

export const DayEmpty: React.FC<DayEmptyProps> = ({ hasDayType }) => (
  <Typography variant="body2" color="text.secondary">
    {hasDayType ? "No sessions planned" : "Empty"}
  </Typography>
);
