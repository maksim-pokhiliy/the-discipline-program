"use client";

import { type ReactElement } from "react";

import { Box } from "@mui/material";

import { IndicatorChip } from "@repo/ui";

import { type EmphasizedIntensityChip as EmphasizedIntensityChipModel } from "../lib/format-block-meta";

type EmphasizedIntensityChipProps = {
  chip: EmphasizedIntensityChipModel;
};

export const EmphasizedIntensityChip: React.FC<EmphasizedIntensityChipProps> = ({
  chip,
}): ReactElement => {
  const indicator = <IndicatorChip tone={chip.tone} label={chip.text} dot={false} />;

  if (!chip.inherited) {
    return <Box component="span">{indicator}</Box>;
  }

  return (
    <Box
      component="span"
      sx={(theme) => ({ display: "inline-flex", opacity: theme.palette.action.disabledOpacity })}
    >
      {indicator}
    </Box>
  );
};
