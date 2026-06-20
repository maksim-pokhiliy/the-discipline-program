import { alpha, type Theme } from "@mui/material/styles";

export const focusRing = (theme: Theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.32)}`;

export const focusRingError = (theme: Theme) => `0 0 0 3px ${alpha(theme.palette.error.main, 0.3)}`;

export const focusRingSubtle = (theme: Theme) =>
  `0 0 0 3px ${alpha(theme.palette.common.white, 0.12)}`;
