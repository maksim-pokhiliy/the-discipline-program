"use client";

import { Chip, Tooltip } from "@mui/material";

import { type DecorationStyles } from "./get-decoration-styles";

export type DecorationBadgeProps = {
  styles: DecorationStyles;
};

export const DecorationBadge = ({ styles }: DecorationBadgeProps) => {
  if (!styles.badgeLabel) {
    return null;
  }

  const chip = (
    <Chip
      size="small"
      color={styles.badgeColor}
      label={styles.badgeLabel}
      variant="filled"
      sx={{ height: 20, fontSize: 10, fontWeight: 600 }}
    />
  );

  if (!styles.tooltip) {
    return chip;
  }

  return (
    <Tooltip title={styles.tooltip} placement="top" arrow>
      <span>{chip}</span>
    </Tooltip>
  );
};
