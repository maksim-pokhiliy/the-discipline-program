import { alpha, type Theme } from "@mui/material";

export const buildOverlay = (theme: Theme) => {
  const black = theme.palette.common.black;

  return `linear-gradient(
    to top right,
    ${alpha(black, 0.75)} 0%,
    ${alpha(black, 0.42)} 40%,
    ${alpha(black, 0.12)} 100%
  )`;
};
