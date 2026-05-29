import { type Components, type Theme } from "@mui/material/styles";

const SEG_FONT_FAMILY = "var(--font-base), Barlow, sans-serif";
const SEG_FONT_SIZE_PX = 11;
const SEG_FONT_SIZE_SM_PX = 10.5;
const SEG_FONT_WEIGHT = 600;
const SEG_LETTER_SPACING = "0.04em";
const SEG_LINE_HEIGHT = 1;
const SEG_PADDING_Y_FACTOR = 0.875;
const SEG_PADDING_X_FACTOR = 1.5;
const SEG_PADDING_Y_SM_FACTOR = 0.625;
const SEG_PADDING_X_SM_FACTOR = 1.125;
const SEG_CHILD_MARGIN = 0;

export const MuiToggleButton: NonNullable<Components<Theme>["MuiToggleButton"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      fontFamily: SEG_FONT_FAMILY,
      fontSize: theme.typography.pxToRem(SEG_FONT_SIZE_PX),
      fontWeight: SEG_FONT_WEIGHT,
      letterSpacing: SEG_LETTER_SPACING,
      textTransform: "uppercase",
      lineHeight: SEG_LINE_HEIGHT,
      color: theme.palette.text.secondary,
      border: "none",
      borderRight: "1px solid",
      borderColor: theme.palette.divider,
      borderRadius: 0,
      padding: theme.spacing(SEG_PADDING_Y_FACTOR, SEG_PADDING_X_FACTOR),
      transition: theme.transitions.create(["background-color", "color"], {
        duration: theme.transitions.duration.shortest,
      }),

      "&:last-of-type": {
        borderRight: "none",
      },

      "&:hover": {
        backgroundColor: theme.palette.action.hover,
        color: theme.palette.text.primary,
      },

      "&.Mui-selected": {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,

        "&:hover": {
          backgroundColor: theme.palette.primary.dark,
        },
      },
    }),

    sizeSmall: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(SEG_FONT_SIZE_SM_PX),
      padding: theme.spacing(SEG_PADDING_Y_SM_FACTOR, SEG_PADDING_X_SM_FACTOR),
    }),

    sizeMedium: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(14),
      padding: theme.spacing(0.75, 1.75),
      minHeight: 36,
    }),

    sizeLarge: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(15),
      padding: theme.spacing(1, 2.25),
      minHeight: 42,
    }),
  },
};

export const MuiToggleButtonGroup: NonNullable<Components<Theme>["MuiToggleButtonGroup"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      display: "inline-flex",
      border: "1px solid",
      borderColor: theme.palette.divider,
      borderRadius: theme.shape.borderRadius,
      overflow: "hidden",
    }),

    firstButton: {
      marginLeft: SEG_CHILD_MARGIN,
    },

    middleButton: {
      marginLeft: SEG_CHILD_MARGIN,
      borderLeft: "none",

      "&.Mui-disabled": {
        borderLeft: "none",
      },
    },

    lastButton: {
      marginLeft: SEG_CHILD_MARGIN,
      borderLeft: "none",

      "&.Mui-disabled": {
        borderLeft: "none",
      },
    },
  },
};
