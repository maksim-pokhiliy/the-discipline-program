import { type Theme, type ThemeOptions } from "@mui/material";

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

const FONT_BASE = 'var(--font-base), "Barlow", sans-serif';
const FONT_DISPLAY = 'var(--font-display), "Barlow Condensed", sans-serif';

export const typography = (baseTheme: Theme): ThemeOptions["typography"] => {
  const h3 = {
    fontSize: baseTheme.typography.pxToRem(24),

    lineHeight: 1.4,

    [baseTheme.breakpoints.down("md")]: {
      fontSize: baseTheme.typography.pxToRem(22),
    },
  };

  const body1 = {
    fontSize: baseTheme.typography.pxToRem(14),
    lineHeight: 1.6,
  };

  return {
    fontFamily: FONT_BASE,

    display1: {
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: baseTheme.typography.pxToRem(72),

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
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: baseTheme.typography.pxToRem(52),

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

      lineHeight: 1.3,

      [baseTheme.breakpoints.down("md")]: {
        fontSize: baseTheme.typography.pxToRem(32),
      },
    },

    h2: {
      fontSize: baseTheme.typography.pxToRem(30),

      lineHeight: 1.35,

      [baseTheme.breakpoints.down("md")]: {
        fontSize: baseTheme.typography.pxToRem(26),
      },
    },

    h3,

    h4: {
      fontSize: baseTheme.typography.pxToRem(20),

      lineHeight: 1.4,
    },

    h5: {
      fontSize: baseTheme.typography.pxToRem(16),

      lineHeight: 1.5,
    },

    h6: {
      fontSize: baseTheme.typography.pxToRem(14),

      lineHeight: 1.5,
    },

    body1,

    body2: {
      fontSize: baseTheme.typography.pxToRem(13),
      lineHeight: 1.6,
    },

    subtitle1: {
      fontSize: baseTheme.typography.pxToRem(14),
      fontWeight: 600,
      lineHeight: 1.5,
    },

    subtitle2: {
      fontSize: baseTheme.typography.pxToRem(13),
      fontWeight: 600,
      lineHeight: 1.5,
    },

    caption: {
      fontSize: baseTheme.typography.pxToRem(12),
      lineHeight: 1.5,
    },

    overline: {
      fontSize: baseTheme.typography.pxToRem(11),
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: "0.06em",
      textTransform: "uppercase" as const,
    },
  };
};
