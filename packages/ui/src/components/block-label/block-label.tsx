"use client";

import { type ReactElement } from "react";

import { Chip, type SxProps, type Theme } from "@mui/material";

const outlinedSx: SxProps<Theme> = (theme) => ({
  backgroundColor: "transparent",
  borderColor: theme.palette.dividerStrong,
  borderWidth: 1,
  borderStyle: "solid",
  color: theme.palette.text.primary,
});

export type BlockLabelProps = {
  text: string;
  filled?: boolean | undefined;
  onDelete?: (() => void) | undefined;
};

export const BlockLabel: React.FC<BlockLabelProps> = ({ text, filled, onDelete }): ReactElement => (
  <Chip
    variant="tag"
    color="default"
    label={text}
    {...(onDelete !== undefined && { onDelete })}
    {...(filled !== true && { sx: outlinedSx })}
  />
);
