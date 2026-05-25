import { type Components, type Theme } from "@mui/material/styles";

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
  ],

  styleOverrides: {
    root: ({ theme }) => ({
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.02857em",
      transition: theme.transitions.create(["background-color", "border-color", "color"], {
        duration: theme.transitions.duration.shortest,
      }),

      "&.Mui-focusVisible": {
        backgroundColor: "transparent",
      },
    }),

    sizeSmall: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(11),
      padding: theme.spacing(0.5, 1.25),
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
