import { alpha, type Components, type Theme } from "@mui/material/styles";

import { type PaletteColorKey } from "../types";

declare module "@mui/material/Button" {
  interface ButtonPropsSizeOverrides {
    tiny: true;
  }
}

const TINY_FONT_PX = 10;
const TINY_LETTER_SPACING = "0.08em";
const TINY_HOVER_BG_ALPHA = 0.08;

export const MuiButton: NonNullable<Components<Theme>["MuiButton"]> = {
  defaultProps: {
    disableElevation: true,
  },

  variants: [
    {
      props: { variant: "outlined", color: "inherit" },
      style: ({ theme }) => ({
        borderColor: theme.palette.divider,

        "&:hover": {
          borderColor: theme.palette.dividerStrong,
        },
      }),
    },
    {
      props: { size: "tiny" },
      style: ({ theme }) => ({
        fontSize: theme.typography.pxToRem(TINY_FONT_PX),
        fontWeight: 700,
        letterSpacing: TINY_LETTER_SPACING,
        lineHeight: 1,
        padding: theme.spacing(0.75),
        minHeight: 0,
        minWidth: 0,
        gap: theme.spacing(0.5),
        borderRadius: theme.spacing(0.5),
      }),
    },
    {
      props: { size: "tiny", variant: "text" },
      style: ({ theme }) => ({
        color: theme.palette.text.secondary,

        "&:hover": {
          color: theme.palette.primary.main,
          backgroundColor: alpha(theme.palette.primary.main, TINY_HOVER_BG_ALPHA),
        },
      }),
    },
  ],

  styleOverrides: {
    root: ({ theme }) => ({
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.02857em",
      transition: theme.transitions.create(
        ["background-color", "border-color", "color", "box-shadow", "filter", "transform"],
        { duration: theme.transitions.duration.shortest },
      ),

      "&:active": {
        transform: "translateY(1px)",
      },
    }),

    contained: ({ theme, ownerState }) => {
      const paletteColor =
        ownerState.color && ownerState.color !== "inherit"
          ? theme.palette[ownerState.color as PaletteColorKey]
          : undefined;

      return {
        "&:hover": {
          ...(paletteColor && { backgroundColor: paletteColor.main }),
          filter: "brightness(1.06)",
        },

        "&:active": {
          filter: "brightness(0.94)",
        },
      };
    },

    sizeSmall: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(11),
      padding: theme.spacing(1, 1.25),
      minHeight: 30,
    }),

    sizeMedium: ({ theme }) => ({
      fontSize: theme.typography.body1.fontSize,
      padding: theme.spacing(0.75, 2),
      minHeight: 38,
    }),

    sizeLarge: ({ theme }) => ({
      fontSize: theme.typography.h4.fontSize,
      padding: theme.spacing(2, 5),
      minHeight: 56,
    }),
  },
};
