import { type Theme, type ThemeOptions } from "@mui/material";

const FONT_BASE = 'var(--font-base), "Barlow", sans-serif';
const FONT_DISPLAY = 'var(--font-display), "Barlow Condensed", sans-serif';

export const typography = (baseTheme: Theme): NonNullable<ThemeOptions["typography"]> => {
  const pxToRem = baseTheme.typography.pxToRem;

  return {
    fontFamily: FONT_BASE,

    h1: {
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: pxToRem(36),
      lineHeight: 1,
      letterSpacing: "-0.01em",
      textTransform: "uppercase" as const,
    },

    h2: {
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: pxToRem(28),
      lineHeight: 1,
      letterSpacing: "-0.005em",
      textTransform: "uppercase" as const,
    },

    h3: {
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: pxToRem(22),
      lineHeight: 1,
      letterSpacing: "-0.005em",
      textTransform: "uppercase" as const,
    },

    h4: {
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: pxToRem(18),
      lineHeight: 1.1,
      letterSpacing: "-0.005em",
      textTransform: "uppercase" as const,
    },

    h5: {
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: pxToRem(16),
      lineHeight: 1.2,
      letterSpacing: "-0.005em",
      textTransform: "uppercase" as const,
    },

    h6: {
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: pxToRem(14),
      lineHeight: 1.2,
      letterSpacing: "-0.005em",
      textTransform: "uppercase" as const,
    },

    body1: {
      fontFamily: FONT_BASE,
      fontWeight: 400,
      fontSize: pxToRem(14),
      lineHeight: 1.5,
    },

    body2: {
      fontFamily: FONT_BASE,
      fontWeight: 400,
      fontSize: pxToRem(13),
      lineHeight: 1.5,
    },

    subtitle1: {
      fontFamily: FONT_BASE,
      fontWeight: 500,
      fontSize: pxToRem(12.5),
      lineHeight: 1.4,
    },

    subtitle2: {
      fontFamily: FONT_BASE,
      fontWeight: 500,
      fontSize: pxToRem(12),
      lineHeight: 1.4,
    },

    caption: {
      fontFamily: FONT_BASE,
      fontWeight: 400,
      fontSize: pxToRem(11),
      lineHeight: 1.4,
      color: baseTheme.palette.text.secondary,
    },

    overline: {
      fontFamily: FONT_BASE,
      fontWeight: 700,
      fontSize: pxToRem(10),
      lineHeight: 1,
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
    },

    button: {
      fontFamily: FONT_BASE,
      fontWeight: 500,
      fontSize: pxToRem(13),
      lineHeight: 1.75,
      letterSpacing: "0.028em",
      textTransform: "uppercase" as const,
    },
  };
};
