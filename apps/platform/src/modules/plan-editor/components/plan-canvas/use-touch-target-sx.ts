"use client";

import { useMediaQuery, useTheme } from "@mui/material";

export type TouchTargetSx = { minHeight?: number; py?: number };

const MOBILE_TOUCH_TARGET: TouchTargetSx = {
  minHeight: 44,
  py: 1.25,
};

const DESKTOP_TOUCH_TARGET: TouchTargetSx = {};

export const useTouchTargetSx = (): TouchTargetSx => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return isMobile ? MOBILE_TOUCH_TARGET : DESKTOP_TOUCH_TARGET;
};
