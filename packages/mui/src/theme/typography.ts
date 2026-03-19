import { type Theme, type ThemeOptions } from "@mui/material";

import { barlow } from "../assets/fonts/barlow";
import { barlowCondensed } from "../assets/fonts/barlow-condensed";

declare module "@mui/material/styles" {
  interface TypographyVariants {
    display1: React.CSSProperties;
    display2: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    display1?: React.CSSProperties;
    display2?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    display1: true;
    display2: true;
  }
}

export const typography = (baseTheme: Theme): ThemeOptions["typography"] => ({
  ...barlow.style,

  display1: {
    fontFamily: barlowCondensed.style.fontFamily,
    fontSize: baseTheme.typography.pxToRem(72),
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
    textTransform: "uppercase" as const,

    [baseTheme.breakpoints.up("xl")]: {
      fontSize: baseTheme.typography.pxToRem(80),
    },

    [baseTheme.breakpoints.down("lg")]: {
      fontSize: baseTheme.typography.pxToRem(56),
    },

    [baseTheme.breakpoints.down("md")]: {
      fontSize: baseTheme.typography.pxToRem(40),
    },
  },

  display2: {
    fontFamily: barlowCondensed.style.fontFamily,
    fontSize: baseTheme.typography.pxToRem(52),
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: "-0.01em",
    textTransform: "uppercase" as const,

    [baseTheme.breakpoints.down("lg")]: {
      fontSize: baseTheme.typography.pxToRem(42),
    },

    [baseTheme.breakpoints.down("md")]: {
      fontSize: baseTheme.typography.pxToRem(32),
    },
  },

  h1: {
    fontSize: baseTheme.typography.pxToRem(40),
    fontWeight: 600,
    lineHeight: 1.3,

    [baseTheme.breakpoints.down("md")]: {
      fontSize: baseTheme.typography.pxToRem(32),
    },
  },

  h2: {
    fontSize: baseTheme.typography.pxToRem(30),
    fontWeight: 600,
    lineHeight: 1.35,

    [baseTheme.breakpoints.down("md")]: {
      fontSize: baseTheme.typography.pxToRem(26),
    },
  },

  h3: {
    fontSize: baseTheme.typography.pxToRem(24),
    fontWeight: 600,
    lineHeight: 1.4,

    [baseTheme.breakpoints.down("md")]: {
      fontSize: baseTheme.typography.pxToRem(22),
    },
  },

  h4: {
    fontSize: baseTheme.typography.pxToRem(20),
    fontWeight: 500,
    lineHeight: 1.4,
  },

  h5: {
    fontSize: baseTheme.typography.pxToRem(16),
    fontWeight: 500,
    lineHeight: 1.5,
  },

  h6: {
    fontSize: baseTheme.typography.pxToRem(14),
    fontWeight: 500,
    lineHeight: 1.5,
  },

  body1: {
    fontSize: baseTheme.typography.pxToRem(14),
    lineHeight: 1.6,
    fontWeight: 400,
  },

  body2: {
    fontSize: baseTheme.typography.pxToRem(13),
    lineHeight: 1.6,
    fontWeight: 400,
  },

  caption: {
    fontSize: baseTheme.typography.pxToRem(12),
    lineHeight: 1.5,
    fontWeight: 400,
  },
});
