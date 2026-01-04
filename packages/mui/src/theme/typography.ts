import { type Theme, type ThemeOptions } from "@mui/material";

import { poppins } from "../assets/fonts/poppins";

export const typography = (baseTheme: Theme): ThemeOptions["typography"] => ({
  ...poppins.style,
  h1: {
    fontSize: baseTheme.typography.pxToRem(80),
    fontWeight: baseTheme.typography.fontWeightBold,
    lineHeight: 1.1,

    [baseTheme.breakpoints.down("lg")]: {
      fontSize: baseTheme.typography.pxToRem(64),
    },

    [baseTheme.breakpoints.down("md")]: {
      fontSize: baseTheme.typography.pxToRem(48),
    },
  },

  h2: {
    fontSize: baseTheme.typography.pxToRem(64),
    fontWeight: baseTheme.typography.fontWeightBold,
    lineHeight: 1.2,

    [baseTheme.breakpoints.down("lg")]: {
      fontSize: baseTheme.typography.pxToRem(56),
    },

    [baseTheme.breakpoints.down("md")]: {
      fontSize: baseTheme.typography.pxToRem(40),
    },
  },

  h3: {
    fontSize: baseTheme.typography.pxToRem(48),
    fontWeight: baseTheme.typography.fontWeightBold,
    lineHeight: 1.2,

    [baseTheme.breakpoints.down("lg")]: {
      fontSize: baseTheme.typography.pxToRem(40),
    },

    [baseTheme.breakpoints.down("md")]: {
      fontSize: baseTheme.typography.pxToRem(32),
    },
  },

  h4: {
    fontSize: baseTheme.typography.pxToRem(36),
    fontWeight: baseTheme.typography.fontWeightRegular,
    lineHeight: 1.3,

    [baseTheme.breakpoints.down("md")]: {
      fontSize: baseTheme.typography.pxToRem(28),
    },
  },

  h5: {
    fontSize: baseTheme.typography.pxToRem(24),
    fontWeight: baseTheme.typography.fontWeightRegular,
    lineHeight: 1.4,

    [baseTheme.breakpoints.down("md")]: {
      fontSize: baseTheme.typography.pxToRem(20),
    },
  },

  h6: {
    fontSize: baseTheme.typography.pxToRem(20),
    fontWeight: baseTheme.typography.fontWeightRegular,
    lineHeight: 1.4,

    [baseTheme.breakpoints.down("md")]: {
      fontSize: baseTheme.typography.pxToRem(18),
    },
  },

  body1: {
    fontSize: baseTheme.typography.pxToRem(16),
    lineHeight: 1.6,
    fontWeight: baseTheme.typography.fontWeightRegular,
  },
});
