"use client";

import { Stack, Typography } from "@mui/material";

import { EmptyAddCell } from "./empty-add-cell";

type DayEmptyProps = {
  hasDayType: boolean;
  onAddDay: () => void;
};

export const DayEmpty: React.FC<DayEmptyProps> = ({ hasDayType, onAddDay }) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Typography variant="body2" color="text.secondary">
      {hasDayType ? "No sessions planned" : "Empty"}
    </Typography>
    <EmptyAddCell label="Add day" onAdd={onAddDay} />
  </Stack>
);
