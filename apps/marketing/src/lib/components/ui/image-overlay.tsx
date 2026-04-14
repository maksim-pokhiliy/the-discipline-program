"use client";

import { Box } from "@mui/material";

import { buildOverlay } from "@repo/mui";

export const ImageOverlay = () => (
  <Box
    sx={(theme) => ({
      position: "absolute",
      inset: 0,
      backgroundImage: buildOverlay(theme),
      zIndex: 1,
    })}
  />
);
