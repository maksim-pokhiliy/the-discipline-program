"use client";

import { type ReactElement } from "react";

import { alpha, Box, Typography } from "@mui/material";

const GHOST_PADDING_X_FACTOR = 1.25;
const GHOST_PADDING_Y_FACTOR = 0.75;
const GHOST_BORDER_RADIUS_FACTOR = 0.5;
const GHOST_MAX_WIDTH = 280;
const GHOST_SHADOW_ALPHA = 0.4;
const GHOST_SHADOW_OFFSET_Y = 6;
const GHOST_SHADOW_BLUR = 16;

type DragGhostProps = {
  label: string;
};

export const DragGhost: React.FC<DragGhostProps> = ({ label }): ReactElement => (
  <Box
    sx={(theme) => ({
      display: "inline-flex",
      alignItems: "center",
      maxWidth: GHOST_MAX_WIDTH,
      px: theme.spacing(GHOST_PADDING_X_FACTOR),
      py: theme.spacing(GHOST_PADDING_Y_FACTOR),
      bgcolor: "background.paper",
      border: 1,
      borderColor: "dividerStrong",
      borderRadius: theme.spacing(GHOST_BORDER_RADIUS_FACTOR),
      boxShadow: `0 ${GHOST_SHADOW_OFFSET_Y}px ${GHOST_SHADOW_BLUR}px ${alpha(
        theme.palette.common.black,
        GHOST_SHADOW_ALPHA,
      )}`,
      cursor: "grabbing",
    })}
  >
    <Typography variant="body2" color="text.primary" noWrap>
      {label}
    </Typography>
  </Box>
);
