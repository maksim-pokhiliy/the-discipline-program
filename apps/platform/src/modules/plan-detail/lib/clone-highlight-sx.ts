import type { CSSObject, Theme } from "@mui/material/styles";

const FADE_DURATION_MS = 250;
const HIGHLIGHT_OPACITY = 0.16;

export const cloneHighlightSx =
  (isHighlighted: boolean) =>
  (theme: Theme): CSSObject => ({
    position: "relative",
    "&::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      borderRadius: "inherit",
      backgroundColor: theme.palette.primary.main,
      opacity: isHighlighted ? HIGHLIGHT_OPACITY : 0,
      transition: `opacity ${FADE_DURATION_MS}ms ease`,
      "@media (prefers-reduced-motion: reduce)": {
        transition: "none",
      },
    },
  });
