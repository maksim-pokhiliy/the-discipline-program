"use client";

import { Chip } from "@mui/material";

export type OverrideModeChipProps = {
  athleteLabel: string | null;
};

export const OverrideModeChip = ({ athleteLabel }: OverrideModeChipProps) => {
  if (!athleteLabel) {
    return null;
  }

  return (
    <Chip color="warning" size="small" variant="outlined" label={`Editing for: ${athleteLabel}`} />
  );
};
