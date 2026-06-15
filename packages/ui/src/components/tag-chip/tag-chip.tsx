"use client";

import { type ReactElement } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { Chip, type ChipProps, type SxProps, type Theme } from "@mui/material";

const outlinedSx: SxProps<Theme> = (theme) => ({
  backgroundColor: "transparent",
  borderColor: theme.palette.dividerStrong,
  borderWidth: 1,
  borderStyle: "solid",
  color: theme.palette.text.primary,
});

const preserveCaseSx: SxProps<Theme> = { textTransform: "none" };

export type TagChipProps = Omit<ChipProps, "variant" | "color"> & {
  filled?: boolean | undefined;
  preserveCase?: boolean | undefined;
};

export const TagChip = ({
  filled,
  preserveCase,
  sx,
  onDelete,
  ...rest
}: TagChipProps): ReactElement => (
  <Chip
    variant="tag"
    color="default"
    {...(onDelete !== undefined && { onDelete, deleteIcon: <CloseIcon /> })}
    sx={[
      filled !== true && outlinedSx,
      preserveCase === true && preserveCaseSx,
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...rest}
  />
);
